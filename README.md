# digi4school-downloader

A downloader for https://digi4school.at/.

## Installation

- Install [Node.js + npm](https://nodejs.org/)
- `npm i -g d4sd`

## Usage

Basic usage: `d4sd <title> -u <email> -o ./download/`

The title also supports glob patterns.

### Examples

```BASH
# Download a specific book using a glob pattern
d4sd 'Grundlagen d?? Elektrotechnik (2|3)*' -u john.doe@example.com -p <password> -o ./download/

# Download your whole shelf
d4sd '*' -u john.doe@example.com -p <password> -o ./download/
```

More options can be found with `d4sd -h`.

## Features

- Digi4school books
- Scook books
- Archives with folders and additional documents
- Typescript API

## Disclaimer

This project is only for educational purposes. Don't download books with this tool please.
