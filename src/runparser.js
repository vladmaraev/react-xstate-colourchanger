//
//  runparser.js
//
/*
  The author or authors of this code dedicate any and all 
  copyright interest in this code to the public domain.
*/


// helper functions for the parser demo

import * as SRGS from './srgs'

function getElement(id) {
  return document.getElementById(id);
}

function appendElement(parent, element, text) {
  var elem = document.createElement(element);
  if (text)
    elem.appendChild(document.createTextNode(text));
  parent.appendChild(elem);
  return elem
}

function runParser(input) {
  var resultsDiv = getElement("results");
  resultsDiv.innerHTML = "";
  var maybeFilter;
  if (getElement("usefilter") && getElement("usefilter").checked) {
    maybeFilter = filter;
    appendElement(resultsDiv, "EM", "Using left-corner filter");
  }
  var startTime = new Date();
  var parseChart = parse(input, grammar, grammar.$root, maybeFilter);
  var parseTime = new Date() - startTime;
  var parseResults = parseChart.resultsForRule(grammar.$root);
  
  console.log(parseResults[0]);
  
  if (parseResults) {
    for (var i in parseResults) {
        resultsDiv.innerHTML += display(parseResults[i],"");
    }
  } else {
    appendElement(resultsDiv, "P", "No results found!");
  }
  
/*
  if (parseResults) { 
    var resultList = appendElement(resultsDiv, "OL");
    for (var i in parseResults) 
      appendElement(resultList, "LI", JSON.stringify(parseResults[i]));
  } else {
    appendElement(resultsDiv, "P", "No results found!");
  }
*/
  var statistics = parseChart.statistics()
  appendElement(resultsDiv, "P", "Chart size: " + statistics.nrEdges + " edges" +
		" (" + statistics.nrPassiveEdges + " passive)");
  appendElement(resultsDiv, "P", "Parse time: " + parseTime + " ms" + 
		" (" + (parseTime / statistics.nrEdges).toFixed(2) + " ms/edge)");
}

function runWordParser() {
  runParser(getElement("input").value.split(/\s+/));
}

function runCharacterParser() {
  runParser(getElement("input").value.split(""));
}

export function loadGrammar(str) {
    var dom = parseXML(str);
    var root = dom.getElementsByTagName("grammar")[0].getAttribute("root");
    var grammar = new SRGS.Grammar(root);
    var xrules = dom.getElementsByTagName("rule");
    for(var r=0; r < xrules.length; r++) {
        var xrule = xrules[r];
        var id = xrule.getAttribute("id");
        grammar[id] = processRuleExpansions(xrule);
    }
    return grammar;
}

function processRuleExpansions(xrule) {
    var xitems = xrule.childNodes;
    var rule = [];
    for(var i=0; i < xitems.length; i++) {
        if (xitems[i].nodeType == 3) {
            var str = xitems[i].textContent.trim();
            if (str != "") {
                rule.push(str.split(/ +/));
            }
        } else if (xitems[i].nodeType == 1) {
            if (xitems[i].nodeName == "token") {
                rule.push(SRGS.Tag(xitems[i].textContent));
            } else if (xitems[i].nodeName == "ruleref") {
                var uri = xitems[i].getAttribute("uri");
                rule.push(SRGS.Ref(uri.slice(1)));
            } else if (xitems[i].nodeName == "tag") {
                rule.push(SRGS.Tag(xitems[i].textContent.trim()));
            } else if (xitems[i].nodeName == "one-of") {
                rule.push(SRGS.OneOf(processRuleExpansions(xitems[i])));
            } else if (xitems[i].nodeName == "item") {
                var repeat = xitems[i].getAttribute("repeat");
                if (!repeat) {
                    rule.push(processRuleExpansions(xitems[i]));
                } else {
                    var r = repeat.split("-");
                    var min = parseInt(r[0]);
                    var max = parseInt(r[1]);
                    max = (max) ? max : Infinity;
                    rule.push(SRGS.Repeat(min, max, processRuleExpansions(xitems[i])));
                }
            } else {
                console.log(xitems[i]);
            }
        }
    }
	return rule;
}

function parseXML(text) {
    if (typeof DOMParser != "undefined") {
        // Mozilla, Firefox, and related browsers
        return (new DOMParser()).parseFromString(text, "application/xml");
    }
    else if (typeof ActiveXObject != "undefined") {
        // Internet Explorer.
        var doc = XML.newDocument();  // Create an empty document
        doc.loadXML(text);            // Parse text into it
        return doc;                   // Return it
    }
    else {
        // As a last resort, try loading the document from a data: URL
        // This is supposed to work in Safari. Thanks to Manos Batsis and
        // his Sarissa library (sarissa.sourceforge.net) for this technique.
        var url = "data:text/xml;charset=utf-8," + encodeURIComponent(text);
        var request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send(null);
        return request.responseXML;
    }
};
