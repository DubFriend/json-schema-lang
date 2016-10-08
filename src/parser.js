'use strict';
const _ = require('underscore');

const isType = s => _.reduce(
    s.split('|'),
    (acc, t, i) => acc && (
        i === 0 ?
            /^!?(Array|Object|Number|Integer|String|Boolean|Null)$/.test(t) :
            /^(Array|Object|Number|Integer|String|Boolean|Null)$/.test(t)
    ),
    true
);

const parseLine = (line, isFirst) => {
    const parsed = {};
    const tokens = _.compact(line.split(/\s/));
    const hasName = () => tokens.length > 1 && isType(tokens[1]);

    const parseType = typeString => {
        const types = _.map(typeString.split('|'), t => t.toLowerCase());
        const isRequired = /^!/.test(types[0]);
        types[0] = types[0].replace('!', '');

        if(isRequired) {
            parsed.required = true;
        }

        if(types.length === 1) {
            parsed.type = types[0];
        }
        parsed.type = types.length === 1 ? types[0] : types;
    }

    const parseOptions = options => {
        const mapType = s => {
            if(/^".*"$/.test(s)) {
                return s.replace(/^"/, '').replace(/"$/, '');
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
            parsed.options = {};
            _.each(options, o => {
                const pieces = o.split(':');
                parsed.options[_.first(pieces)] = mapType(_.rest(pieces).join(':'));
            });
        }
    };

    if(hasName()) {
        if(isFirst) {
            parsed.id = `/${tokens[0]}`;
        }
        else {
            parsed.field = tokens[0];
        }
        parseType(tokens[1]);
        tokens.splice(0, 2);
    }
    else {
        parseType(tokens[0]);
        tokens.splice(0, 1);
    }

    parseOptions(tokens);

    return parsed;
};

module.exports = string => {
    const lines = _.compact(_.map(string.split(/\n/), l => l.replace(/\s+$/, '')))

    const getIndent = l => {
        const match = _.first((l || '').match(/^\s+/));
        return match ? match.length : 0;
    };

    const parse = (ctx, lines, baseIndent) => {
        if(lines.length) {
            ctx.props = [];
        }

        let l = lines.shift()
        while(l) {
            let indentLevel = getIndent(l);
            if(indentLevel === baseIndent) {
                ctx.props.push(parseLine(l));
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
    }

    const l = lines.shift();
    let parsed = parseLine(l, true);
    parse(parsed, lines, getIndent(_.first(lines) || ''));
    return parsed;
};
