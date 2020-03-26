# "Modern Debugging with WinDbg Preview" DEFCON 27 workshop

This repository contains the materials for the [DEFCON 27](https://defcon.org/html/defcon-27/dc-27-index.html) [workshop](https://defcon.org/html/defcon-27/dc-27-workshops.html#alladoum)


## Overview

### Abstract

It's 2019 and yet too many Windows developers and hackers alike rely on (useful but rather) old school tools for debugging Windows binaries (OllyDbg, Immunity Debugger). What they don't realize is that they are missing out on invaluable tools and functionalities that come with Microsoft newest WinDbg Preview edition. This hands-on workshop will attempt to level the field, by practically showing how WinDbg has changed to a point where it should be the first tool to be installed on any Windows (10) for binary analysis machine: after a brief intro to the most basic (legacy) commands, this workshop will focus around debugging modern software (vulnerability exploitation, malware reversing, DKOM-based rootkit, JS engine) using modern techniques provided by WinDbg Preview (spoiler alert to name a few, JavaScript, LINQ, TTD). By the end of this workshop, trainees will have their WinDbg-fu skilled up.


### Where/when?

Saturday August 10th 2019, 1430-1830
Flamingo, Lake Mead II


### Skill Level

Intermediate


### Prerequisites

Familiarity with Windows platform and kernel debugging
Working knowledge of debuggers (pref. WinDbg)
Working knowledge of JavaScript

### Materials

Any modern laptop running Windows 10 + a hypervisor with one Windows 10 VM guest (for example with remote debugging via `kdnet `, but can work out with `lkd`). Also need Internet access.


## Quick Links

  * [WindDbg CheatSheet](windbg_cheatsheet.md)


## Acknowledgment

This workshop was originally produced as part of my (`hugsy`) work at [**@SophosLabs**](https://github.com/sophoslabs) in the Offensive Security Team.


## Authors

 * `hugsy` 
   * [![twitter](https://i.imgur.com/BIbG3EG.png)](https://twitter.com/_hugsy_) [![gh](https://i.imgur.com/TFRgRGW.png)](https://github.com/hugsy)
   
 * `0vercl0k` 
   * [![twitter](https://i.imgur.com/BIbG3EG.png)](https://twitter.com/0vercl0k) [![gh](https://i.imgur.com/TFRgRGW.png)](https://github.com/0vercl0k)
