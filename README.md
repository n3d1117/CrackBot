# CrackBot (deprecated since iTunes 12.7)
An old, ugly and deprecated script to download, decrypt and upload .ipa files to [appdb](https://appdb.store).

![Screenshot](https://i.imgur.com/jLEbCSp.jpg)

## PREREQUISITES
- iTunes version <12.7.
- `cfgutil` command line utility - bundled with Apple Configurator 2.
- a jailbroken device connected via usb with ssh access and a cracking script installed - here i use rc336.
- ftp access to a website for hosting .ipa files.
- [appdb](http://appdb.store/) uploader account.

## RUNNING THE SCRIPT
Before running, edit bot configuration with your details, including appdb cookie, hash and PHPSESSID.

Also make sure you're logged in the iTunes app, preferably with a US account.

Once ready, run with `./bot <iTunes link>`.

## CREDITS
This project uses a JXA (JavaScript for Automation) script to download .ipa file from iTunes. It's a modified version of [this open source project](https://github.com/attheodo/cherrypick).
All credits go to the original developer.
