# WinDbg cheatsheet

## Content

- [WinDbg cheatsheet](#WinDbg-cheatsheet)
  - [Content](#Content)
  - [Setup](#Setup)
    - [Symbol Path](#Symbol-Path)
  - [Commands](#Commands)
    - [Basic commands](#Basic-commands)
      - [`.printf` formatters](#printf-formatters)
    - [Execution flow](#Execution-flow)
    - [Registers / Memory access](#Registers--Memory-access)
    - [Memory search](#Memory-search)
    - [Breakpoints](#Breakpoints)
    - [Symbols](#Symbols)
    - [Convenience variables and functions](#Convenience-variables-and-functions)
    - [Useful extensions](#Useful-extensions)
  - [LINQ & Debugger Data Model](#LINQ--Debugger-Data-Model)
  - [WinDbg JavaScript reference](#WinDbg-JavaScript-reference)
  - [Time-Travel Debugging](#Time-Travel-Debugging)
  - [Additional resources](#Additional-resources)



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


## Commands

### Basic commands

| Action | Command | Examples |
| :--- | --- | --- |
| Help / Manual | `.hh <command>` | `.hh` <br> `.hh !process` |
| Clear screen | `.cls` |  |
| Dynamic evaluation | `?` |  `? 40004141 – nt` <br> `? 2 + 2` <br> `? nt!ObTypeArrayIndex` |
| Comment | `$$` |`$$ this is a useful comment` |
| Print a string | `.echo` | `.echo "Hello world"`|
| Print a formatted string<br>(see [printf formatters](#printf-formatters)) |  `.printf` | `.printf "Hello %ma\n" , @$esp` |
| Command separator | `;`|`command1 ; command2` |
| Attach (Detach) to (from) process  | `.attach`  | `.detach`  | `.attach 0n<PID>` |
| Display parameter value under different formats (hexadcimal, decimal, octal) | `.formats` | `.formats 0x42` |
| Change default base |  `n` | `n 8` | `n 10` |
| Quit WinDbg (will kill the process if not detached) | `q`| |
| Restart debugging session | `.restart` | |
| Reboot system (KD) | `.reboot` | |


#### `.printf` formatters

| Description | Formatter | Examples |
| :--- | --- | --- |
|ASCII C string (i.e. NULL terminated)|`%ma`||
|Wide C string (i.e. NULL terminated)|`%mu`||
|UNICODE_STRING** string|`%msu`||
|Print the symbol pointed by address|`%y`|`.printf “%p\n”,nt!PsLoadedModuleList  // returns 0xffff8009bc2010`|
|Pointer|`%p`|`.printf “%y\n”,ffff8009bc2010 // returns nt!PsLoadedModuleList`|


### Execution flow 

| Action | Command | Examples |
| :--- | --- | --- |
| Start or resume execution (go) |  `g` |
| Dump register(s) | `r` | `r` <br> `r eax` <br> `r rax=42` |
| Step over | `p` | `pa 0xaddr` (step over until 0xaddr is reached) <br>`pt` (step over until return) <br> `pc` (step over until next call) |
| Step into | `t` | Same as above, replace `p` with `t` |
| Execute until reaching current frame return address (go upper) | `gu` | |
| List module(s) |`lm`|`lm` (UM: display all modules) <br>`lm` (KM: display all drivers and sections) <br> `lm m *MOD*` (show module with pattern '`MOD`' ) |
| Get information about current debugging status|`.lastevent`<br>`!analyze`||
| Show stack call | `k`<br>`kp` | |


### Registers / Memory access

| Action | Command | Examples |
| :--- | --- | --- |
| Read memory As | bytes: `db`<br>word: `dw`<br>dword: `dd`<br>qword: `dq`<br>pointer: `dp`<br>unicode string: `dW` |`db @sp 41 41 41 41`<br>`dw @rip 0041`<br>`dd @rax l4`<br>`dyb @rip`<br>`dps @esp`<br>`dW @rsp`|
| Write memory As | bytes: `eb`<br>word: `ew`<br>dword: `ed`<br>qword: `eq`<br>ascii string:`ea`<br>Unicode string: `eu` |<br><br><br>`ea @pc "AAAA"` |
| Read register(s) | `r`<br>`r [[REG0],REG1,...]` | `r rax,rbp` |
| Write register(s) | `r [REG]=[VALUE]`  | `r rip=4141414141414141` |
| Show register(s) modified by the current instruction | `r.` | |
|Dump memory to file|`.writemem`|`.writemem C:\mem.raw @eip l1000`|
| Load memory from file | `.readmem`|`.readmem C:\mem.raw @rip l1000`|
|Dump MZ/PE header info|`!dh`|`!dh kernel32`<br>`!dh @rax`|
| Read / write physical memory<br>(syntax similar to `dX`/`eX` commands) | `!db` / `!eb` <br>`!dw` / `!ew` <br>`!dd` / `!ed` <br>`!dq` / `!eq` | |
| Fill / Compare memory |`f`<br> `c`| `f @rsp l8 41`<br> `c @rsp l8 @rip`|
|Dereference memory|`poi(<AddrOrSymbol>)`: dereference pointer size<br>`dwo()`: dereference DWORD<br>`qwo()`: dereference QWORD|`db poi( @$rax )`|


### Memory search

| Action | Command | Examples |
| :--- | --- | --- |
| Search | byte: `s [RANGE] [VALUE]`<br>dword: `s -d [RANGE] [DWORD_VALUE]` | `s @eip @eip+100 90 90 90 cc`<br>`s -d @eax l100 41424344` |
| Search ASCII (Unicode) | `s –a <AddrStart> L<NbByte> "Pattern"`<br> `s –a <AddrStart> <AddrEnd> "Pattern"`<br> (for Unicode – change `–a` with `–u`)| |
| Search for pattern in command |  `.shell` |`.shell -ci "<windbg command>" batch command`<br>`.shell -ci "!address" findstr PAGE_EXECUTE_READWRITE` |



### Breakpoints 

| Action | Command | Examples |
| :--- | --- | --- |
| Examine | `x`|`x nt!*CreateProcess*`|
| Display types|`dt`|`dt ntdll!_PEB @$peb`<br>`dt ntdll!_TEB –r @$teb`|
| Set breakpoint|`bp` <br>`bp 0xaddr / symbol`<br>`bp /1 0xaddr` (disable after 1 hit)<br>`bp 0xaddr 7` (disable after 6 hits)|
|List breakpoints| `bl` | |
|Disable breakpoint(s)| `bd [IDX]` (`IDX` is returned by `bl`) | `bd 1`<br>`bd *` |
|Delete breakpoint(s)| `bc [IDX]` (`IDX` is returned by `bl`) | `bc 0`<br>`bc *` |
|(Un)Set exception on event|`sx` |`sxe ld mydll.dll`|
|Break on memory access|`ba`|`ba r 4 @esp`|
|Define breakpoint command|`bp … [Command]`<br>Where [Command] can be<br>- an action: "`r ; g`"<br>- a condition: "`.if (@$rax == 1) {.printf \"rcx=%p\\\n\", @rcx }`"|
| Enable breakpoint **after** *N* hit(s) | `bp <address> N+1` | |
| Set "undefined" breakpoint | `bu <address>` | |






### Symbols 

| Action | Command | Examples |
| :--- | --- | --- |
|Examine|`x`|`x /t /v ntdll!*CreateProcess*`|
|Display types|`dt`|`dt ntdll!_PEB @$peb`|
|List nearest symbols|`ln`|`ln 0xaddr`|
|Set/update symbol path|`.sympath` ||
|Load module symbols|`ld`|`ld Module`<br>`ld *`|


### Convenience variables and functions 

| Action | Command | Examples |
| :--- | --- | --- |
|Program entry point|`$exentry`|`bp $exentry`|
|Process Environment Block|`$peb`|`dt _PEB @$peb`|
|Thread Environment Block|`$teb`|`dt _TEB @$teb`|
|Return Address|`$ra`|`g @ra`|
|Instruction Pointer|`$ip`||
|Size of Page|`$pagesize`||
|Size of Pointer|`$ptrsize`||
|Process ID|`$tpid`||
|Thread ID|`$tid`||



### Useful extensions

| Action | Command | Examples |
| :--- | --- | --- |
|Detailed information about loaded DLLs|`!dlls`<br>`!dlls -I` (show load order)<br>`!dlls -c 0xaddr (show DLL containing0xaddr)||
|Get mapping information|`!address`|`!address -f:MEM_COMMIT`|
|Change verbosity of symbol loader|`!sym`|`!sym noisy`<br>`!sym quiet`|
|Dump PEB/TEB information|`!peb` <br>`!teb` ||
|Analyze the reason of a crash|`!analyze`|`!analyze -v`|
|Convert an NTSTATUS code to text|`!error`|`!error c0000048`|
|Perform heuristic checks to<br>the exploitability of a bug|`!exploitable`||
|Encode/decode pointer encoded<br>by KernelBase API `EncodePointer()`|`!encodeptr32` (or `64`)<br>`!decodeptr32` (or `64`)|
|Display the current exception handler|`!exchain`||
|Dump UM heap information|`!heap`||



## LINQ & Debugger Data Model 

| Variable description | Command | Examples |
| :--- | --- | --- |
| Create a variable| `dx @$myVar = VALUE`  | `dx @$ps = @$cursession.Processes` |
| Delete a variable | `dx @$vars.Remove("VarName")` | `dx @$vars.Remove("ps")` |
| List user defined variable | `dx @$vars`| `dx @$Debugger.State.UserVariables`|

 
| Function description | Command | Examples |
| :--- | --- | --- |
| Filtering objects | `[Object].Where( [FILTER PATTERN] )` | `$CurSession.Processes.Where( x => x.Name == "notepad.exe")` |
| Projecting |`.Select( [PROJECTION KEYS] )` |`.Select( p => new { Item1 = p.Name, Item2 = p.Id } )` |
|Access `n-th` element of `iterable`| `[i]` | `@$cursession.Processes[4]`|
|Get the number of objects in `iterable`|`.Count()`||



## WinDbg JavaScript reference


| Action | Command | Examples |
| :--- | --- | --- |
| Print message | `host.diagnostics.debugLog` | |
| Read data from memory | `host.memory.readMemoryValues` | |
|Read string from memory|`host.memory.readString`<br>`host.memory.readWideString`| |
|Evaluate expression|`host.evaluateExpression`| |
|Resolve symbol|`host.getModuleSymbolAddress`| |
|Dereference a pointer as anobject|`host.createPointerObject(...).dereference()`| |
|Dereference memory|`host.evaluateExpression('(int*)0xADDRESS').dereference()`| |
|Convert string to `Int64`|`host.parseInt64('value')`<br>`host.parseInt64('value', 16 )`|`host.parseInt64('42');`<br>`host.parseInt64('0x1337', 16);`|
|Get access to the Pseudo-Registers|`host.namespace.Debugger.State.PseudoRegisters`|`var entrypoint = host.namespace.Debugger.State.PseudoRegisters.General.exentry.address;`|
|Execute WinDbg command|`host.namespace.Debugger.Utility.Control.ExecuteCommand`|`var modules=host.namespace.Debugger.Utility.Control.ExecuteCommand("lm");`|
|Set Breakpoint|`host.namespace.Debugger.Utility.Control.SetBreakpointAtSourceLocation`<br>`host.namespace.Debugger.Utility.Control.SetBreakpointAtOffset`<br>`host.namespace.Debugger.Utility.Control.SetBreakpointForReadWrite`|
|Iterate through `LIST_ENTRY`s|`host.namespace.Debugger.Utility.Collections.FromListEntry`|`var process_iterator = host.namespace.Debugger.Utility.Collections.FromListEntry( pAddrOfPsActiveProcessHead, "nt!_EPROCESS", "ActiveProcessLinks")`|


## Time-Travel Debugging

 
| Action | Command | Examples |
| :--- | --- | --- |
| DDM Object | `@$curprocess.TTD` | `dx @$curprocess.TTD` |
| Run execution back | `g-` | |
| Reverse Step Over | `p-` | |
| Reverse Step Into | `t-` | |
| Regenerate the index | `!ttdext.index` | |
| Jump to position `XX:YY` (WinDbg) | `!tt XX:YY`| `!tt 1B:0` |
| Jump to position `XX:YY` (DDM) | `<TtdPosition>.SeekTo()`| `dx @$curprocess.TTD.Lifetime.MinPosition.SeekTo()` |



## Additional resources


 * https://www.youtube.com/watch?list=PLhx7-txsG6t6n_E2LgDGqgvJtCHPL7UFu 
 * https://www.youtube.com/playlist?list=PLjAuO31Rg973XOVdi5RXWlrC-XlPZelGn 

