'use strict';

const _ = require('underscore');
const parser = require('../src/parser');
const expect = require('chai').expect;

describe('parser.unit', () => {
    it('should parse type String', () => {
        expect(parser('String')).to.deep.equal({ type: 'string' });
    });

    it('should parse type Null', () => {
        expect(parser('Null')).to.deep.equal({ type: 'null' });
    });

    it('should parse type Number', () => {
        expect(parser('Number')).to.deep.equal({ type: 'number' });
    });

    it('should parse type Integer', () => {
        expect(parser('Integer')).to.deep.equal({ type: 'integer' });
    });

    it('should parse type Boolean', () => {
        expect(parser('Boolean')).to.deep.equal({ type: 'boolean' });
    });

    it('should parse type Object', () => {
        expect(parser('Object')).to.deep.equal({ type: 'object' });
    });

    it('should parse type Array', () => {
        expect(parser('Array')).to.deep.equal({ type: 'array' });
    });

    it('should parse id', () => {
        expect(parser('idName Integer')).to.deep.equal({
            id: '/idName',
            type: 'integer'
        });
    });

    it('should parse multiple types', () => {
        expect(parser('String|Integer')).to.deep.equal({
            type: ['string', 'integer']
        });
    });

    it('should parse multiple types with name', () => {
        expect(parser('fieldName String|Number')).to.deep.equal({
            id: '/fieldName',
            type: ['string', 'number']
        });
    });

    it('should parse required', () => {
        expect(parser('!Array')).to.deep.equal({
            type: 'array',
            required: true
        });
    });

    it('should parse required on multiple types', () => {
        expect(parser('!Array|Number')).to.deep.equal({
            type: ['array', 'number'],
            required: true
        });
    });

    it('should parse required with id', () => {
        expect(parser('foo !String')).to.deep.equal({
            id: '/foo',
            type: 'string',
            required: true
        });
    });

    it('should parse options', () => {
        expect(parser('String a:1 b:"2" c:true d:false e:/reg/')).to.deep.equal({
            type: 'string',
            options: { a: 1, b: '2', c: true, d: false, e: '/reg/' }
        });
    });

    it('should parse named and required and multiple types and options', () => {
        expect(parser('foo !String|Array a:1 b:"foo"')).to.deep.equal({
            id: '/foo',
            type: ['string', 'array'],
            options: { a: 1, b: 'foo' },
            required: true
        });
    });

    it('should parse multiline string as Object fields', () => {
        expect(parser(`
            Object
                a !String
                b Number
        `)).to.deep.equal({
            type: 'object',
            props: [
                {
                    field: 'a',
                    type: 'string',
                    required: true
                },
                {
                    field: 'b',
                    type: 'number'
                }
            ]
        });
    });

    it('should parse nested objects', () => {
        expect(parser(`id Object
                a !Object
                  aa String
                  ab Object

                     abc Integer
                  ac !String a:1
                b Number
        `)).to.deep.equal({
            id: '/id',
            type: 'object',
            props: [
                {
                    field: 'a',
                    type: 'object',
                    required: true,
                    props: [
                        { field: 'aa', type: 'string' },
                        {
                            field: 'ab',
                            type: 'object',
                            props: [{ field: 'abc', type: 'integer' }]
                        },
                        {
                            field: 'ac',
                            type: 'string',
                            options: { a: 1 },
                            required: true
                        }
                    ]
                },
                {
                    field: 'b',
                    type: 'number'
                }
            ]
        });
    });
});
