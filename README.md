# digi4school-downloader

A downloader for https://digi4school.at/.

## Installation

- Install [Node.js + npm](https://nodejs.org/)
- `npm i -g d4sd`

## Usage

Basic usage  
`d4sd -u <email> <...books>`

Specify a password and an output folder  
`d4sd -u <email> -p <password> -o ./download/ <...books>`

Download specific books using a glob pattern  
`d4sd -u john.doe@example.com -o ./download/ "Grundlagen d?? Elektrotechnik (2|3)*"`

Download your whole shelf  
`d4sd -u john.doe@example.com -o ./download/ "*"`

Download a book using an url  
`d4sd -u john.doe@exapme.com "https://digi4school.at/ebook/xxxxxxxxxxxx"` (`"another url"`...)

More options can be found with `d4sd -h`.

**Note:** On Linux, make sure to use single quotes `'` instead of `"`.

## Features

- Digi4school books
- "E-Book-Plus" (Scook books integrated to digi4school)
- Archives with folders and additional documents
- Typescript API

## Disclaimer

This project is only for educational purposes. Don't download books with this tool please.
