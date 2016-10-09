# JSON Schema Language

Compact Syntax for JSON Schema validation.

```javascript
var exampleSchema = {
  "id": "/SimpleAddress",
  "type": "object",
  "properties": {
    "lines": {
      "type": "array",
      "items": {"type": "string"}
    },
    "zip": {"type": "string"},
    "city": {"type": "string"},
    "country": {"type": "string"}
  },
  "required": ["country"]
};

var schema = {
  "id": "/SimplePerson",
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "address": {"$ref": "/SimpleAddress"},
    "votes": {"type": "integer", "minimum": 1}
  }
};
```

## Element: Base Type
```js
[!]Type options...
```

## Element: Object Type
```js
[!]Type options...
  fieldName [Element]
  ...
```

## Array Type
```js
[!]Type options...
  [Element]
  ...
```

```js
!Object
  field !UUID
  obj Object
    a Number >5
    b !Email
  arr Array maxLength=5
    !Object
    Integer >5 <100
```

```js
SimpleAddress Object
  address !Object
    streetAddress !String
    city !String
  phoneNumber !Array
    Object
      location !String >=1 <=100 pattern=/^[a-z]{8}/
      code !Integer multipleOf=10 >0 >=0 <100 <=100
```
https://spacetelescope.github.io/understanding-json-schema/index.html
```js
Example Object title:"Example Schema" description:"Example Description"
  // express multiple types allowed
  multipleTypes String|Number|Boolean|Null
  // bang "!" denotes required field
  string !String minLength:2 maxLength:8 pattern:/^[a-z]+/
  number Number|Integer multipleOf:3 minimum:1 exclusiveMinimum:1 maximum:5 exclusiveMaximum:5
  object Object additionalProperties:false minProperties:2 maxProperties:5
    // express property dependencies
    a["b 1", c]
    "b 1" Number
    c String
    // express schema extension dependencies
    @dependencies
      // if "b 1" field is set then require the following schema updates
      "b 1" minProperties:3
        d !String
    // expressed match patterns for keys with
    @patternProperties
      // any additional properties that start with "foo" must be type string.
      /^foo/ String
      /^bar/ Object additionalProperties:false
        baz Boolean
    // Can match additional non matching properties to a schema
    @additionalProperties String
  array Array minItems:3 maxItems:5 uniqueItems:true
    String
  // additionalItems used when tuple to control if allowed other items in the array
  tuple Array additionalItems:false
    String
    Object minProperties:1
    Number minimum:1
  boolean Boolean
  null Null
  enum String enum:["blue", 5, null]
  // also anyOf and oneOf
  allOfExample allOf
    !String minimumLength:5
    Integer
  notAString
    @not String
```

```js
//heres a trick to extend existing schema
Object
  extended allOf
    // referencing earlier schema id'd "Example"
    Example
    Object
      foo !String
```

```js
AnyOfExample anyOf
  String maxLength:5
  Number
```


`!Integer`
