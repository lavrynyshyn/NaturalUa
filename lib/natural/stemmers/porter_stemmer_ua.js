/*
Copyright (c) 2012, Polyakov Vladimir, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var Stemmer = require('./stemmer_ua');

var PorterStemmer = new Stemmer();
module.exports = PorterStemmer;

function attemptReplacePatterns(token, patterns) {
	var replacement = null;
	var i = 0, isReplaced = false;
	while ((i < patterns.length) && !isReplaced) {
		if (patterns[i][0].test(token)) {
			replacement = token.replace(patterns[i][0], patterns[i][1]);
			isReplaced = true;
		}
		i++;
	}
	return replacement;
};

function perfectiveGerund(token) {
	var result = attemptReplacePatterns(token, [
			[/[ая]в(ши|шись)$/g, ''],
			[/(ив|ивши|ившись)$/g, '']
		]);
	return result;
};

function adjectival(token) {
	var result = adjective(token);
	if (result != null) {
		var pariticipleResult = participle(result);
		result = pariticipleResult ? pariticipleResult : result;
	}
	return result;
};

function adjective(token) {
	var result = attemptReplacePatterns(token, [
			[/(ими|ій|ий|а|е|ова|ове|ів|є|їй|єє|еє|я|ім|ем|им|ім|их|іх|ою|йми|іми|у|ю|ого|ому|ої)$/g, '']
		]);
	return result;
};

function participle(token) {
	var result = attemptReplacePatterns(token, [
		[/(ий|ого|ому|им|ім|а|ій|у|ою|ій|і|их|йми|их)$/g, ''],
	]);
	return result;
};

function reflexive(token) {
	var result = attemptReplacePatterns(token, [
		[/(с[яьи])$/g, '']
	]);
	return result;
};

function verb(token) {
	var result = attemptReplacePatterns(token, [
		[/(сь|ся|ив|ать|ять|у|ю|ав|али|учи|ячи|вши|ши|е|ме|ати|яти|є)$/g, ''],
	]);
	return result;
};

function noun(token) {
	var result = attemptReplacePatterns(token, [
		[/(а|ев|ов|е|ями|ами|еи|и|ей|ой|ий|й|иям|ям|ием|ем|ам|ом|о|у|ах|иях|ях|ы|ь|ию|ью|ю|ия|ья|я|і|ові|ї|ею|єю|ою|є|еві|ем|єм|ів|їв|ю)$/g, '']
	]);
	return result;
};

function superlative (token) {
	var result = attemptReplacePatterns(token, [
		[/(ейше)$/g, '']
	]);
	return result;
};

function derivational (token) {
	var result = attemptReplacePatterns(token, [
		[/(ост|ость)$/g, '']
	]);
	return result;
};

// perform full stemming algorithm on a single word
PorterStemmer.stem = function(token) {
	token = token.toLowerCase().replace(/ё/g, 'е');
	var volwesRegexp = /^(.*?[аеиоуюяіїє])(.*)$/g;
	var RV = volwesRegexp.exec(token);
	if (!RV || RV.length < 3) {
		return token;
	}
	var head = RV[1];
	RV = RV[2];
	volwesRegexp.lastIndex = 0;
	var R2 = volwesRegexp.exec(RV);
	var result = perfectiveGerund(RV);
	if (result === null) {
		var resultReflexive = reflexive(RV) || RV;
		result = adjectival(resultReflexive);
		if (result === null) {
			result = verb(resultReflexive);
			if (result === null) {
				result = noun(resultReflexive);
				if (result === null) {
					result = resultReflexive;
				}
			}
		}
	}
	result = result.replace(/і$/g, '');
	var derivationalResult = result
	if (R2 && R2[2]) {
		derivationalResult = derivational(R2[2]);
		if (derivationalResult != null) {
			derivationalResult = derivational(result);
		} else {
			derivationalResult = result;
		}
	}

	var superlativeResult = superlative(derivationalResult) || derivationalResult;

	superlativeResult = superlativeResult.replace(/(н)н/g, '$1');
	superlativeResult = superlativeResult.replace(/ь$/g, '');
	return head + superlativeResult;
};
