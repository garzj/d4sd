# digi4school-downloader

## Features

- Download books and archives with folders and additional documents from https://digi4school.at/
- Download books from https://www.scook.at/ (only by url)
- Typescript API

## Installation

- Install [Node.js + npm](https://nodejs.org/)
- `npm i -g d4sd`

## Usage

Basic usage  
`d4sd -u <user> <...books>`

Specify a password and an output folder  
`d4sd -u <user> -p <password> -o ./download/ <...books>`

Download specific books using a glob pattern  
`d4sd -u john.doe@example.com -o ./download/ "Grundlagen d?? Elektrotechnik (2|3)*"`

Download your whole shelf  
`d4sd -u john.doe@example.com -o ./download/ "*"`

Download a book using an url  
`d4sd -u john.doe@example.com "https://digi4school.at/ebook/xxxxxxxxxxxx"` (`"another url"`...)

Download a scook book  
`d4sd -s -u john.doe@example.com "https://www.scook.at/produkt/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`

More options can be found with `d4sd -h`.

**Note:** On Linux, make sure to use single quotes `'` instead of `"`.

## Disclaimer

This project is only for educational purposes. Don't download books with this tool please.
