# WinDbg cheatsheet

## Content

- [WinDbg cheatsheet](#windbg-cheatsheet)
  - [Content](#content)
  - [Setup](#setup)
    - [Symbol Path](#symbol-path)
    - [Providers](#providers)
    - [VS Code linting](#vs-code-linting)
    - [Kernel Debugging](#kernel-debugging)
  - [Commands](#commands)
    - [Basic commands](#basic-commands)
      - [`.printf` formatters](#printf-formatters)
    - [Execution flow](#execution-flow)
    - [Registers / Memory access](#registers--memory-access)
    - [Memory search](#memory-search)
    - [Breakpoints](#breakpoints)
    - [Symbols](#symbols)
    - [Convenience variables and functions](#convenience-variables-and-functions)
    - [Useful extensions](#useful-extensions)
    - [.NET Debugging](#net-debugging)
  - [LINQ & Debugger Data Model](#linq--debugger-data-model)
  - [WinDbg JavaScript reference](#windbg-javascript-reference)
    - [Dealing with `host.Int64`](#dealing-with-hostint64)
    - [WinDbg gallery skeleton](#windbg-gallery-skeleton)
  - [Time-Travel Debugging](#time-travel-debugging)
  - [Additional resources](#additional-resources)



## Setup

### Symbol Path

In a command prompt:

```batch
C:\> setx _NT_SYMBOL_PATH srv*C:\Symbols*https://msdl.microsoft.com/download/symbols
```

In WinDbg, `Ctrl+S` then
```batch
srv*C:\Symbols*https://msdl.microsoft.com/download/symbols
```

[Back to top](#Content)


### Providers

In WinDbg
```
0:000> .scriptproviders
```

Should display something like
```
Available Script Providers:
    NatVis (extension '.NatVis')
    JavaScript (extension '.js')
```

### VS Code linting

Download [JsProvider.d.ts](JsProvider.d.ts) to the root of your script and add the following at its top:
```javascript
/// <reference path="JSProvider.d.ts" />
"use strict";
```

### Kernel Debugging

* [Increase the kernel verbosity level](https://docs.microsoft.com/en-us/windows-hardware/drivers/devtest/reading-and-filtering-debugging-messages#setting-the-component-filter-mask) from calls to `KdPrintEx()`
  * temporarily during runtime from WinDbg (lost once session is closed)
```
kd> ed nt!Kd_Default_Mask 0xf
```
  * permanently from registry hive (in Admin prompt on Debuggee)
```
C:\> reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Debug Print Filter" /v DEFAULT /t REG_DWORD /d 0xf
```

## Commands

### Basic commands

| Action                                                                       | Command         | Examples                                                      |
| :--------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------- |
| Help / Manual                                                                | `.hh <command>` | `.hh` <br> `.hh !process`                                     |
| Clear screen                                                                 | `.cls`          |                                                               |
| Dynamic evaluation                                                           | `?`             | `? 40004141 – nt` <br> `? 2 + 2` <br> `? nt!ObTypeArrayIndex` |
| Comment                                                                      | `$$`            | `$$ this is a useful comment`                                 |
| Print a string                                                               | `.echo`         | `.echo "Hello world"`                                         |
| Print a formatted string<br>(see [printf formatters](#printf-formatters))    | `.printf`       | `.printf "Hello %ma\n" , @$esp`                               |
| Command separator                                                            | `;`             | `command1 ; command2`                                         |
| Attach (Detach) to (from) process                                            | `.attach`       | `.detach`                                                     | `.attach 0n<PID>` |
| Display parameter value under different formats (hexadcimal, decimal, octal) | `.formats`      | `.formats 0x42`                                               |
| Change default base                                                          | `n`             | `n 8`                                                         | `n 10`            |
| Quit WinDbg (will kill the process if not detached)                          | `q`             |                                                               |
| Restart debugging session                                                    | `.restart`      |                                                               |
| Reboot system (KD)                                                           | `.reboot`       |                                                               |

[Back to top](#Content)
#### `.printf` formatters

| Description                           | Formatter | Examples                                                            |
| :------------------------------------ | --------- | ------------------------------------------------------------------- |
| ASCII C string (i.e. NULL terminated) | `%ma`     |                                                                     |
| Wide C string (i.e. NULL terminated)  | `%mu`     |                                                                     |
| UNICODE_STRING** string               | `%msu`    |                                                                     |
| Print the symbol pointed by address   | `%y`      | `.printf “%y\n”,ffff8009bc2010 // returns nt!PsLoadedModuleList`    |
| Print a Pointer                       | `%p`      | `.printf “%p\n”,nt!PsLoadedModuleList  // returns 0xffff8009bc2010` |

[Back to top](#Content)
### Execution flow 

| Action                                                         | Command                    | Examples                                                                                                                             |
| :------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Start or resume execution (go)                                 | `g`                        |
| Dump register(s)                                               | `r`                        | `r` <br> `r eax` <br> `r rax=42`                                                                                                     |
| Step over                                                      | `p`                        | `pa 0xaddr` (step over until 0xaddr is reached) <br>`pt` (step over until return) <br> `pc` (step over until next call)              |
| Step into                                                      | `t`                        | Same as above, replace `p` with `t`                                                                                                  |
| Execute until reaching current frame return address (go upper) | `gu`                       |                                                                                                                                      |
| List module(s)                                                 | `lm`                       | `lm` (UM: display all modules) <br>`lm` (KM: display all drivers and sections) <br> `lm m *MOD*` (show module with pattern '`MOD`' ) |
| Get information about current debugging status                 | `.lastevent`<br>`!analyze` |                                                                                                                                      |
| Show stack call                                                | `k`<br>`kp`                |                                                                                                                                      |

[Back to top](#Content)
### Registers / Memory access

| Action                                                                 | Command                                                                                                     | Examples                                                                                   |
| :--------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Read memory As                                                         | bytes: `db`<br>word: `dw`<br>dword: `dd`<br>qword: `dq`<br>pointer: `dp`<br>unicode string: `dW`            | `db @sp 41 41 41 41`<br>`dw @rip`<br>`dd @rax l4`<br>`dyb @rip`<br>`dps @esp`<br>`dW @rsp` |
| Write memory As                                                        | bytes: `eb`<br>word: `ew`<br>dword: `ed`<br>qword: `eq`<br>ascii string:`ea`<br>Unicode string: `eu`        | <br><br><br>`ea @pc "AAAA"`                                                                |
| Read register(s)                                                       | `r`<br>`r [[REG0],REG1,...]`                                                                                | `r rax,rbp`                                                                                |
| Write register(s)                                                      | `r [REG]=[VALUE]`                                                                                           | `r rip=4141414141414141`                                                                   |
| Show register(s) modified by the current instruction                   | `r.`                                                                                                        |                                                                                            |
| Dump memory to file                                                    | `.writemem`                                                                                                 | `.writemem C:\mem.raw @eip l1000`                                                          |
| Load memory from file                                                  | `.readmem`                                                                                                  | `.readmem C:\mem.raw @rip l1000`                                                           |
| Dump MZ/PE header info                                                 | `!dh`                                                                                                       | `!dh kernel32`<br>`!dh @rax`                                                               |
| Read / write physical memory<br>(syntax similar to `dX`/`eX` commands) | `!db` / `!eb` <br>`!dw` / `!ew` <br>`!dd` / `!ed` <br>`!dq` / `!eq`                                         |                                                                                            |
| Fill / Compare memory                                                  | `f`<br> `c`                                                                                                 | `f @rsp l8 41`<br> `c @rsp l8 @rip`                                                        |
| Dereference memory                                                     | `poi(<AddrOrSymbol>)`: dereference pointer size<br>`dwo()`: dereference DWORD<br>`qwo()`: dereference QWORD | `db poi( @$rax )`                                                                          |

[Back to top](#Content)
### Memory search

| Action                        | Command                                                                                                                     | Examples                                                                                                |
| :---------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Search                        | byte: `s [RANGE] [VALUE]`<br>dword: `s -d [RANGE] [DWORD_VALUE]`                                                            | `s @eip @eip+100 90 90 90 cc`<br>`s -d @eax l100 41424344`                                              |
| Search ASCII (Unicode)        | `s –a <AddrStart> L<NbByte> "Pattern"`<br> `s –a <AddrStart> <AddrEnd> "Pattern"`<br> (for Unicode – change `–a` with `–u`) |                                                                                                         |
| Search for pattern in command | `.shell`                                                                                                                    | `.shell -ci "<windbg command>" batch command`<br>`.shell -ci "!address" findstr PAGE_EXECUTE_READWRITE` |


[Back to top](#Content)
### Breakpoints 

| Action                                             | Command                                                                                                                                     | Examples                                                                                      |
| :------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Examine                                            | `x`                                                                                                                                         | `x nt!*CreateProcess*`                                                                        |
| Display types                                      | `dt`                                                                                                                                        | `dt ntdll!_PEB @$peb`<br>`dt ntdll!_TEB –r @$teb`                                             |
| Display Type Extended - with Debugger Object Model | `dtx`                                                                                                                                       | `dtx nt!_PEB 0x000008614a7a000`<br>which is equivalent to<br>`dx (nt!_PEB*)0x000008614a7a000` |
| Set breakpoint                                     | `bp` <br>`bp 0xaddr (or mod!symbol)`                                                                                                        |                                                                                               |
| List breakpoints                                   | `bl`                                                                                                                                        |                                                                                               |
| Disable breakpoint(s)                              | `bd [IDX]` (`IDX` is returned by `bl`)                                                                                                      | `bd 1`<br>`bd *`                                                                              |
| Delete breakpoint(s)                               | `bc [IDX]` (`IDX` is returned by `bl`)                                                                                                      | `bc 0`<br>`bc *`                                                                              |
| (Un)Set exception on event                         | `sx`                                                                                                                                        | `sxe ld mydll.dll`                                                                            |
| Break on memory access                             | `ba`                                                                                                                                        | `ba r 4 @esp`                                                                                 |
| Define breakpoint command                          | `bp … [Command]`<br>Where [Command] can be<br>- an action: "`r ; g`"<br>- a condition: "`.if (@$rax == 1) {.printf \"rcx=%p\\\n\", @rcx }`" | `bp kernel32!CreateFileA "da @rcx; g"` "                                                      |
| Enable breakpoint **after** *N* hit(s)             | `bp <address> N+1`                                                                                                                          | `bp /1 0xaddr` (temporary breakpoint)<br>`bp 0xaddr 7` (disable after 6 hits)                 |
| Set "undefined" breakpoint                         | `bu <address>`                                                                                                                              |                                                                                               |





[Back to top](#Content)
### Symbols 

| Action                 | Command    | Examples                        |
| :--------------------- | ---------- | ------------------------------- |
| Examine                | `x`        | `x /t /v ntdll!*CreateProcess*` |
| Display types          | `dt`       | `dt ntdll!_PEB @$peb`           |
| List nearest symbols   | `ln`       | `ln 0xaddr`                     |
| Set/update symbol path | `.sympath` |                                 |
| Load module symbols    | `ld`       | `ld Module`<br>`ld *`           |


[Back to top](#Content)
### Convenience variables and functions 

| Action                    | Command     | Examples        |
| :------------------------ | ----------- | --------------- |
| Program entry point       | `$exentry`  | `bp $exentry`   |
| Process Environment Block | `$peb`      | `dt _PEB @$peb` |
| Thread Environment Block  | `$teb`      | `dt _TEB @$teb` |
| Return Address            | `$ra`       | `g @ra`         |
| Instruction Pointer       | `$ip`       |                 |
| Size of Page              | `$pagesize` |                 |
| Size of Pointer           | `$ptrsize`  |                 |
| Process ID                | `$tpid`     |                 |
| Thread ID                 | `$tid`      |                 |


[Back to top](#Content)
### Useful extensions

| Action                                                               | Command                                                                                  | Examples                     |
| :------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------- |
| Detailed information about loaded DLLs                               | `!dlls`<br>`!dlls -I` (show load order)<br>`!dlls -c 0xaddr` (show DLL containing0xaddr) |                              |
| Get mapping information                                              | `!address`                                                                               | `!address -f:MEM_COMMIT`     |
| Change verbosity of symbol loader                                    | `!sym`                                                                                   | `!sym noisy`<br>`!sym quiet` |
| Dump PEB/TEB information                                             | `!peb` <br>`!teb`                                                                        |                              |
| Analyze the reason of a crash                                        | `!analyze`                                                                               | `!analyze -v`                |
| Convert an NTSTATUS code to text                                     | `!error`                                                                                 | `!error c0000048`            |
| Perform heuristic checks to<br>the exploitability of a bug           | `!exploitable`                                                                           |                              |
| Encode/decode pointer encoded<br>by KernelBase API `EncodePointer()` | `!encodeptr32` (or `64`)<br>`!decodeptr32` (or `64`)                                     |
| Display the current exception handler                                | `!exchain`                                                                               |                              |
| Dump UM heap information                                             | `!heap`                                                                                  |                              |

[Back to top](#Content)
### .NET Debugging

| Action                                 | Command                           | Examples                                                                                                                                                                |
| :------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Load the CLR extensions                | `.loadby sos clr`                 | `sxe ld clr; g` to make sure `clr.dll` is loaded, then `.loadby sos clr`                                                                                                |
| Get help                               | `!help`                           |                                                                                                                                                                         |
| Set managed code breakpoint            | `!bpmd <module> Path.To.Function` | `!bpmd mscorlib.dll System.Reflection.Assembly.Load` <br> `!bpmd System.dll System.Diagnostics.Process.Start` <br> `!bpmd System.dll System.Net.WebClient.DownloadFile` |
| List all managed code breakpoints      | `!bpmd -list`                     |                                                                                                                                                                         |
| Clear specific managed code breakpoint | `!bpmd -clear $BreakpointNumber`  |                                                                                                                                                                         |
| Clear all managed code breakpoints     | `!bpmd -clearall`                 |                                                                                                                                                                         |
| Dump objects                           | `!DumpObj`                        | `!DumpObj /d 0x<address>`                                                                                                                                               |
| Dump the .NET stack                    | `!CLRStack`                       | `!CLRStack -p`                                                                                                                                                          |


[Back to top](#Content)
## LINQ & Debugger Data Model 

| Variable description                                        | Command                                            | Examples                                                     |
| :---------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Create a variable                                           | `dx @$myVar = VALUE`                               | `dx @$ps = @$cursession.Processes`                           |
| Delete a variable                                           | `dx @$vars.Remove("VarName")`                      | `dx @$vars.Remove("ps")`                                     |
| List user defined variable                                  | `dx @$vars` <br> `dx Debugger.State.UserVariables` |                                                              |
| Bind address `Address` to <br>a `N`-entry array of type `T` | `dx (T* [N])0xAddress `                            | `dx (void** [5]) Debugger.State.PseudoRegisters.General.csp` |
 
| Function description                            | Command                                                                                                     | Examples                                                                                                                                                                                                                                                                                            |
| :---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create a "lambda" inline function               | `dx @$my_function = ([arg0, arg1] => Code)`                                                                 | ` dx @$add = (x, y => x + y)`                                                                                                                                                                                                                                                                       |
| Filtering objects                               | `[Object].Where( [FILTER PATTERN] )`                                                                        | `dx @$cursession.Processes.Where( x => x.Name == "notepad.exe")`                                                                                                                                                                                                                                    |
| Sorting objects                                 | - asc: `[Object].OrderBy([Sort Expression])`<br>- desc: `[Object].OrderByDescending([Sort Expression])`<br> | `dx @$cursession.Processes.OrderByDescending(x => x.KernelObject.UniqueProcessId)`                                                                                                                                                                                                                  |
| Projecting                                      | `.Select( [PROJECTION KEYS] )`                                                                              | `.Select( p => new { Item1 = p.Name, Item2 = p.Id } )`                                                                                                                                                                                                                                              |
| Access `n-th` element of `iterable`             | `$Object[n]`                                                                                                | `@$cursession.Processes[4]`                                                                                                                                                                                                                                                                         |
| Get the number of objects in `iterable`         | `$Object.Count()`                                                                                           | `@$cursession.Processes.Count()`                                                                                                                                                                                                                                                                    |
| Create a iterator from a `LIST_ENTRY` structure | `dx Debugger.Utility.Collections.FromListEntry(Address, TypeAsString, "TypeMemberNameAsString")`            | `dx @$ProcessList = Debugger.Utility.Collections.FromListEntry( *(nt!_LIST_ENTRY*)&(nt!PsActiveProcessHead), "nt!_EPROCESS", "ActiveProcessLinks")` <br>`dx @$HandleList = Debugger.Utility.Collections.FromListEntry( *(nt!_LIST_ENTRY*)&(nt!PspCidTable), "nt!_HANDLE_TABLE", "HandleTableList")` |
| Apply a structure `S` to memory (`dt`-like)     | `dx (S*)0xAddress`                                                                                          | `dx (nt!_EPROCESS*)&@$curprocess.KernelObject`                                                                                                                                                                                                                                                      |

[Back to top](#Content)
## WinDbg JavaScript reference


| Action                             | Command                                                                                                                                                                                                           | Examples                                                                                                                                              |
| :--------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Print message                      | `host.diagnostics.debugLog(Message)`                                                                                                                                                                              |                                                                                                                                                       |
| Read data from memory              | `host.memory.readMemoryValues(0xAddr, Length)`                                                                                                                                                                    |                                                                                                                                                       |
| Read string from memory            | `host.memory.readString(0xAddr)`<br>`host.memory.readWideString(0xAddr)`                                                                                                                                          |                                                                                                                                                       |
| Evaluate expression                | `host.evaluateExpression([EXPR])`                                                                                                                                                                                 | `var res=host.evaluateExpression("sizeof(_LIST_ENTRY)")`<br>`dx @$scriptContents.host.evaluateExpression("sizeof(_LIST_ENTRY)")`                      |
| Resolve symbol                     | `host.getModuleSymbolAddress(mod, sym)`                                                                                                                                                                           | `var pRtlAllocateHeap = host.getModuleSymbolAddress('ntdll', 'RtlAllocateHeap');`                                                                     |
| Dereference a pointer as an object | `host.createPointerObject(...).dereference()`                                                                                                                                                                     | `var pPsLoadedModuleHead = host.createPointerObject(host.getModuleSymbolAddress("nt", "PsLoadedModuleList"), "nt", "_LIST_ENTRY *");`                 |
| Create typed variable from address | `host.createTypedObject(addr, module, symbol)`                                                                                                                                                                    | `var loader_data_entry = host.createTypedObject(0xAddress,"nt","_LDR_DATA_TABLE_ENTRY")`                                                              |
| Dereference memory                 | `host.evaluateExpression('(int*)0xADDRESS').dereference()`                                                                                                                                                        |                                                                                                                                                       |
| Get access to the Pseudo-Registers | `host.namespace.Debugger.State.PseudoRegisters`                                                                                                                                                                   | `var entrypoint = host.namespace.Debugger.State.PseudoRegisters.General.exentry.address;`                                                             |
| Execute WinDbg command             | `host.namespace.Debugger.Utility.Control.ExecuteCommand`                                                                                                                                                          | `var modules=host.namespace.Debugger.Utility.Control.ExecuteCommand("lm");`                                                                           |
| Set Breakpoint                     | `host.namespace.Debugger.Utility.Control.SetBreakpointAtSourceLocation`<br>`host.namespace.Debugger.Utility.Control.SetBreakpointAtOffset`<br>`host.namespace.Debugger.Utility.Control.SetBreakpointForReadWrite` |
| Iterate through `LIST_ENTRY`s      | `host.namespace.Debugger.Utility.Collections.FromListEntry()`                                                                                                                                                     | `var process_iterator = host.namespace.Debugger.Utility.Collections.FromListEntry( pAddrOfPsActiveProcessHead, "nt!_EPROCESS", "ActiveProcessLinks")` |

### Dealing with `host.Int64`

| Action                           | Command                                                                                                                                                                                                   | Examples                                                                                                  |
| :------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Create/Convert an `Int64` object | `host.parseInt64('value')`<br>`host.parseInt64('value', 16 )`                                                                                                                                             | `host.parseInt64('42');`<br>`host.parseInt64('0x1337', 16);`                                              |
| Add / Subtract                   | `[Int64Obj].add($int)`<br>`[Int64Obj].subtract($int)`                                                                                                                                                     | `var NextPage = BasePage.add(0x1000);`<br> `var NextPage = BasePage.subtract(0x1000);`                    |
| Multiply / Divide                | `[Int64Obj].multiply($int)`<br>`[Int64Obj].divide($int)`                                                                                                                                                  |                                                                                                           |
| Compare                          | `[Int64Obj1].compareTo([Int64Obj2])`                                                                                                                                                                      | `BasicBlock.StartAddress.compareTo(Address1) <= 0`                                                        |
| Bitwise operation                | and: `[Int64Obj].bitwiseAnd($int)`<br>or: `[Int64Obj].bitwiseOr($int)`<br>xor: `[Int64Obj].bitwiseXor($int)`<br>lsh: `[Int64Obj].bitwiseShiftLeft($shift)`<br>rsh: `[Int64Obj].bitwiseShiftRight($shift)` | `var PageBase = Address.bitwiseAnd(0xfffff000);`<br>`Address.bitwiseShiftLeft(12).bitwiseShiftRight(12);` |
| Convert `Int64` to native number | - with exception if precision loss: `[Int64Obj].asNumber()`<br>- no exception if precision loss: `[Int64Obj].convertToNumber()`                                                                           |                                                                                                           |

### WinDbg gallery skeleton

Only 3 files are needed (see [5] for more details):

 - `config.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Settings Version="1">
  <Namespace Name="Extensions">
    <Setting Name="ExtensionRepository" Type="VT_BSTR" Value="Implicit"></Setting>
    <Namespace Name="ExtensionRepositories">
      <Namespace Name="My Awesome Gallery">
        <Setting Name="Id" Type="VT_BSTR" Value="any-guid-will-do"></Setting>
        <Setting Name="LocalCacheRootFolder" Type="VT_BSTR" Value="\absolute\path\to\the\xmlmanifest\directory"></Setting>
        <Setting Name="IsEnabled" Type="VT_BOOL" Value="true"></Setting>
      </Namespace>
    </Namespace>
  </Namespace>
</Settings>
```

 - `ManifestVersion.txt`
```
1
1.0.0.0
1
```

 - `Manifest.X.xml` (where `X` is the version number, let's just use `1` so it is `Manifest.1.xml`)
```xml
<?xml version="1.0" encoding="utf-8"?>
<ExtensionPackages Version="1.0.0.0" Compression="none">
  <ExtensionPackage>
    <Name>Script1</Name>
    <Version>1.0.0.0</Version>
    <Description>Description of Script1.</Description>
    <Components>
      <ScriptComponent Name="Script1" Type="Engine" File=".\relative\path\to\Script1.js" FilePathKind="RepositoryRelative">
        <FunctionAliases>
          <FunctionAlias Name="AliasCreatedByScript`">
            <AliasItem>
              <Syntax><![CDATA[!AliasCreatedByScript]]></Syntax>
              <Description><![CDATA[Quick description of AliasCreatedByScript.]]></Description>
            </AliasItem>
          </FunctionAlias>
        </FunctionAliases>
      </ScriptComponent>
    </Components>
  </ExtensionPackage>
</ExtensionPackages>
```

Then in WinDbg load & save:
```
0:000> .settings load \path\to\config.xml
0:000> .settings save
```

[Back to top](#Content)
## Time-Travel Debugging

| Action                            | Command                                  | Examples                                                                                                 |
| :-------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| DDM Objects                       | `@$curprocess.TTD`<br>`@$cursession.TTD` | `dx @$curprocess.TTD.Threads.First().Lifetime` <br> `dx @$cursession.TTD.Calls("ntdll!Nt*File").Count()` |
| Run execution back                | `g-`                                     |                                                                                                          |
| Reverse Step Over                 | `p-`                                     |                                                                                                          |
| Reverse Step Into                 | `t-`                                     |                                                                                                          |
| Regenerate the index              | `!ttdext.index`                          |                                                                                                          |
| Jump to position `XX:YY` (WinDbg) | `!tt XX:YY`                              | `!tt 1B:0`                                                                                               |  |
| Jump to position `XX:YY` (DDM)    | `<TtdPosition>.SeekTo()`                 | `dx @$curprocess.TTD.Lifetime.MinPosition.SeekTo()`                                                      |


[Back to top](#Content)
## Additional resources

 1. [WinDbg .printf formatters](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/-printf#syntax-elements)
 2. [JavaScript Debugger Scripting](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/javascript-debugger-scripting)
 3. [WinDbg Pseudo-Register Syntax](https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/pseudo-register-syntax#automatic-pseudo-registers)
 4. [WinDbg Playlist on YouTube](https://www.youtube.com/watch?v=d5Xr6oqu_ac&list=PLjAuO31Rg973XOVdi5RXWlrC-XlPZelGn)
 5. [WinDbg Extension Gallery](https://github.com/microsoft/WinDbg-Samples/tree/master/Manifest)
 6. [SOS commands for .NET debugging](https://docs.microsoft.com/en-us/dotnet/framework/tools/sos-dll-sos-debugging-extension)



[Back to top](#Content)
