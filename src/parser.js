'use strict';

const _ = require('underscore');

const tokenize = line => _.compact(line.split(/\s/));

const stringToken = s => String(
    /^".*"$/.test(s) ? s.replace(/^"/, '').replace(/"$/, '') : s
);

const parseLine = (lineUntrimmed, isFirst) => {
    const line = lineUntrimmed.trim();

    const isType = s => _.reduce(
        s.split('|'),
        (acc, t, i) => acc && (
            i === 0 ?
                /^!?(Array|Object|Number|Integer|String|Boolean|Null)$/.test(t) :
                /^(Array|Object|Number|Integer|String|Boolean|Null)$/.test(t)
        ),
        true
    );

    const hasName = tokens => tokens.length > 1 && isType(tokens[1]);

    const parseType = typeString => {
        const types = _.map(typeString.split('|'), t => t.toLowerCase());
        const isRequired = /^!/.test(types[0]);

        types[0] = types[0].replace('!', '');

        let newProps = {};

        if(isRequired) {
            newProps.required = true;
        }

        newProps.type = types.length === 1 ? types[0] : types;

        return newProps;
    };

    const parseOptions = options => {
        const mapType = s => {
            if(/^".*"$/.test(s)) {
                return stringToken(s);
            }
            else if(/^[0-9]$/.test(s)) {
                return Number(s);
            }
            else if(/^true$/.test(s)) {
                return true;
            }
            else if (/^false$/.test(s)) {
                return false;
            }
            else {
                return s;
            }
        };

        if(options.length) {
            let mapped = {};
            _.each(options, o => {
                const pieces = o.split(':');
                mapped[_.first(pieces)] = mapType(_.rest(pieces).join(':'));
            });
            return mapped;
        }
    };

    const regEndingBrackets = /\[[^\]]+\]$/;

    const parseDependentProps = name => {
        if(name) {
            let match = _.first(regEndingBrackets.exec(name));
            match = match && match.replace(/^\[/, '').replace(/\]$/, '');
            return match && _.map(
                match.split(','),
                t => stringToken(t.trim())
            );
        }
    };

    const parseName = name => name.replace(regEndingBrackets, '');

    const tokens = tokenize(line);

    let parsed = {};

    if(hasName(tokens)) {
        parsed = parseType(tokens[1]);
        if(isFirst) {
            parsed.id = `/${parseName(tokens[0])}`;
        }
        else {
            parsed.field = parseName(tokens[0]);
        }

        const dependentProps = parseDependentProps(tokens[0]);
        if(dependentProps) {
            parsed.dependentProps = dependentProps;
        }

        tokens.splice(0, 2);
    }
    else {
        parsed = parseType(tokens[0]);
        tokens.splice(0, 1);
    }

    const options = parseOptions(tokens);
    if(options) {
        parsed.options = options;
    }

    return parsed;
};

module.exports = string => {
    const getIndent = l => {
        const match = _.first((l || '').match(/^\s+/));
        return match ? match.length : 0;
    };

    const parse = (ctx, lines, baseIndent) => {
        if(lines.length) {
            ctx.props = [];
        }

        const extractLeadingSubLines = (lines, baseIndent) => {
            let l = lines.shift();
            let subLines = [];

            while(l && getIndent(l) > baseIndent) {
                subLines.push(l);
                l = lines.shift();
            }

            if(l) {
                lines.unshift(l);
            }

            return subLines;
        };

        const parsePatternProperties = lines => {
            let l = lines.shift();
            const indent = getIndent(l);
            let parsed = {};
            while(l) {
                const tokens = tokenize(l);
                const firstToken = tokens.shift();
                const key = firstToken.replace(/^\//, '').replace(/\/$/, '');
                const subLines = [tokens.join(' ')].concat(extractLeadingSubLines(lines, indent));
                parsed[key] = parseSchema(subLines);
                l = lines.shift();
            }
            return parsed;
        };

        const parseSchemaAdditionDependencies = lines => {
            let l = lines.shift();
            const indent = getIndent(l);
            let parsed = {};
            while(l) {
                const tokens = tokenize(l);
                const key = stringToken(tokens.shift());
                const subLines = [`Object ${tokens.join(' ')}`].concat(extractLeadingSubLines(lines, indent));
                parsed[key] = _.omit(parseSchema(subLines), 'type');
                l = lines.shift();
            }
            return parsed;
        };

        let l = lines.shift();
        while(l) {
            let indentLevel = getIndent(l);

            if(indentLevel === baseIndent) {
                if(/^\s*@patternProperties/.test(l)) {
                    ctx.patternProperties = parsePatternProperties(
                        extractLeadingSubLines(lines, indentLevel)
                    );
                }
                else if(/^\s*@additionalProperties/.test(l)) {
                    ctx.additionalProperties = parseSchema(
                        [l.replace(/^\s*@additionalProperties/, '')].concat(
                            extractLeadingSubLines(lines, indentLevel)
                        )
                    );
                }
                else if(/^\s*@dependencies/.test(l)) {
                    ctx.dependencies = parseSchemaAdditionDependencies(
                        extractLeadingSubLines(lines, indentLevel)
                    );
                }
                else {
                    ctx.props.push(parseLine(l));
                }
            }
            else if(indentLevel > baseIndent) {
                lines.unshift(l);
                parse(_.last(ctx.props), lines, indentLevel);
            }
            else {
                lines.unshift(l);
                break;
            }
            l = lines.shift();
        }
    };

    const parseSchema = lines => {
        const l = lines.shift();
        let parsed = parseLine(l, true);
        parse(parsed, lines, getIndent(_.first(lines)));
        return parsed;
    };

    return parseSchema(_.filter(
        _.map(string.split(/\n/), l => l.replace(/\s+$/, '')),
        l => l && !/^\s*\/\/.*$/.test(l)
    ));
};
