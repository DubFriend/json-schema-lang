'use strict';

const _ = require('underscore');

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

    const hasName = () => tokens.length > 1 && isType(tokens[1]);

    const stringToken = s => String(
        /^".*"$/.test(s) ? s.replace(/^"/, '').replace(/"$/, '') : s
    );

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

    const tokens = _.compact(line.split(/\s/));

    let parsed = {};

    if(hasName()) {
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

    const lines = _.filter(
        _.map(string.split(/\n/), l => l.replace(/\s+$/, '')),
        l => l && !/^\s*\/\/.*$/.test(l)
    );

    const parse = (ctx, baseIndent) => {
        if(lines.length) {
            ctx.props = [];
        }

        let l = lines.shift();
        while(l) {
            let indentLevel = getIndent(l);
            if(indentLevel === baseIndent) {
                ctx.props.push(parseLine(l));
            }
            else if(indentLevel > baseIndent) {
                lines.unshift(l);
                parse(_.last(ctx.props), indentLevel);
            }
            else {
                lines.unshift(l);
                break;
            }
            l = lines.shift();
        }
    };

    const l = lines.shift();
    let parsed = parseLine(l, true);
    parse(parsed, getIndent(_.first(lines)));
    return parsed;
};
