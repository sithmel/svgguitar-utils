# svgguitar-utils

A JavaScript library that adds a few utilities to [svguitar](https://github.com/omnibrain/svguitar).

- editableSVGuitar wraps SVGuitar and make it editable
- stringToFingering transforms a text representation of a fingering into data that can be used to render that fingering using SVGuitar
- fingeringToString transforms data into a text representation of a fingering
- guitar-fingering: is a remark markdown plugin that is used to convert a markdown document containing text representations of fingerings, into a svg images

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