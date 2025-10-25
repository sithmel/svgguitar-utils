# svgguitar-utils

A JavaScript library that adds a few utilities to [svguitar](https://github.com/omnibrain/svguitar).

- editableSVGuitar wraps SVGuitar and make it editable
- stringToFingering transforms a text representation of a fingering into data that can be used to render that fingering using SVGuitar
- fingeringToString transforms data into a text representation of a fingering
- guitar-fingering: is a remark markdown plugin that is used to convert a markdown document containing text representations of fingerings, into a svg images

# How to represent a fingering using text

2 formats a supported. A concise ascii one that is designed to be edited easily and a nicer one that uses unicode, looks better but is more difficult to edit.

### Ascii
```
  A min  
  oo   o
  ||||o|
  ||o*||
  ||||||

  D
  xo   o
  ||||||
  |||o|o
  ||||*|

  G 7
  xx  
5 ||*|||
  ||||o|
  |||o|o

  A min  
  51   5
  ||||3|
  ||51||
  ||||||

```
### Unicode
```
  A minor
  ○ ○       ○
  ╒═╤═╤═╤═╤═╕
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ ○ ● │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘

  D
  × ○ ○
  ╒═╤═╤═╤═╤═╕
  │ │ │ │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ● │
  └─┴─┴─┴─┴─┘

  G 7
  × ×
  ╒═╤═╤═╤═╤═╕
5 │ │ ● │ │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ ○ │
  ├─┼─┼─┼─┼─┤
  │ │ │ ○ │ ○
  └─┴─┴─┴─┴─┘

  A minor
  5 1       5
  ╒═╤═╤═╤═╤═╕
  │ │ │ │ 3 │
  ├─┼─┼─┼─┼─┤
  │ │ 5 1 │ │
  ├─┼─┼─┼─┼─┤
  │ │ │ │ │ │
  └─┴─┴─┴─┴─┘

```


## TypeScript Support

This library includes TypeScript declarations generated from JSDoc comments:

```bash
npm run build:types
```

## Development

### Running Tests

```bash
npm test
npm run test:watch  # Watch mode
```

### Generate Type Declarations

```bash
npm run build:types
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.