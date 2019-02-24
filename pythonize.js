/*
    Doesn't work at the moment for things with {}, ; inside brackets
*/

//default index size in spaces
const indent_size = 4;
const target_chars = "{}";
function containsChar(str, target) {};

function pythonize(str) {
    //turn tabs into spaces
    str = str.replace(/\t/g, " ".repeat(indent_size));

    //we want to preserve blank spaces in original formatting, so we keep newlines
    var tokens = str.split("\n");

    
    for(var i = 0; i<tokens.length; i++) {
        if(tokens[i] === "") {
            tokens[i] = "\n";
        }
    }

    //preserve all the empty newlines: give them a 
    var lengths = [];

    for (var i = 0; i < tokens.length; i++) {
        lengths.push(tokens[i].length);
    }
    //This is the start index for the brackets and semicolon
    //max index + indent size
    max_length = Math.max(...lengths)+indent_size; 

    //seperate out the semicolons and brackets into seperate tokens
    //step 1 in the pipeline

    for(var tokenNum = 0; tokenNum < tokens.length; tokenNum++) {
        var curLine = tokens[tokenNum];
        var startBracketIndex = curLine.indexOf("{");
        var endBracketIndex = curLine.indexOf("}");
        var cutIndex, cutChar;
        //assume {} doesn't occur badly
        if (startBracketIndex != -1) {
            if(endBracketIndex != -1 && endBracketIndex < startBracketIndex) {
                cutIndex = endBracketIndex;
                cutChar = "}";
            } else {
                cutIndex = startBracketIndex;
                cutChar = "{";   
            } 
        }
        else {
            cutIndex = endBracketIndex;
            cutChar = "}";
        } 

        if (cutIndex == -1) {
            //don't do splitting if there's none of those characters
            continue;
        }
        prefix = curLine.substring(0, cutIndex).trimRight();
        postfix = curLine.substring(cutIndex+1).trimRight();
        //if prefix is nonempty, put it into the array
        //removes the original thing, 
        //We'll deal with empty prefixes later when we clean up the list
        tokens.splice(tokenNum, 1, prefix, cutChar);
        //if postfix exists, then add it to the array
        if (postfix !== "") {
            tokens.splice(tokenNum + 2, 0, postfix);
        }
        tokenNum++; //assumes that prefix doesn't have any more symbols
    }

    //clean up empty strings
    for(var tokenNum = 0; tokenNum < tokens.length; tokenNum++) {
        if(tokens[tokenNum] === "") {
            tokens.splice(tokenNum, 1);
        }
    }

    //combine adjacent elements in the list that contain target symbols
    for(var tokenNum = 0; tokenNum < tokens.length; tokenNum++) {
        var curLine = tokens[tokenNum];
        if (containsChar(curLine, target_chars)) {
            tokenNum ++;
            //Coaslesce further seperating symbol tokens together
            while (tokenNum < tokens.length && 
                containsChar(tokens[tokenNum], target_chars)) {
                var removedLine = tokens.splice(tokenNum, 1);
                //-1 offset is because we shifted back 1 already
                tokens[tokenNum-1] += removedLine;
            }
            tokenNum --;
        }
    }

    //Combine these special tokens into the regular lines with 
    //python style indentation
    //Process semicolons and then process brackets
    for(var i = 0; i<tokens.length; i++) {
        curLine = tokens[i]
        //if it's a special line, combine it with the previous line
        //which is already padded because we went through it!
        semicolon_index = curLine.lastIndexOf(";");
        //if the semicolon is the last character of the trimmed string
        if (semicolon_index != -1 && semicolon_index+1 == curLine.trimRight().length) {
            tokens[i] = curLine.substring(0, semicolon_index).padEnd(max_length) + ";";
        } //otherwise check if it's a bracket string
        else if (containsChar(tokens[i], target_chars) && i>0) {
            //check if the previous string is a singleline comment; then don't combine with it
            if(tokens[i-1].indexOf("//") != -1) {
                continue;
            }   
            //combine the string with the previous string
            //trim left sometimes is redundant
            paddedString = tokens[i-1].padEnd(max_length)+tokens[i].trimLeft();
            tokens.splice(i-1, 2, paddedString);
            i--; //to offset the index plus at the end of loop
        } 
        //otherwise do nothing, line is fine
    }

    //remove extraneous newlines now
    for(var i = 0; i<tokens.length; i++) {
        if(tokens[i] === "\n") {
            tokens[i] = "";
        }
    }

    return tokens.join("\n");
}

//Returns whether or not string contains any of the characters in target
function containsChar(str, target) {
    for (var i = 0; i<str.length; i++) {
        if(target.indexOf(str[i]) != -1) {
            return true;
        }
    }
    return false;
}