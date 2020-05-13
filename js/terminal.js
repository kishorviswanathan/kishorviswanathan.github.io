    var terminal = $("#terminal");
var commandHistory = [];
var currentHistoryPosition = null;
var homePaths = ["~",".","./","~/", "/root/", "/root"];
var files = $('.data > #files > div').map(function(){
    return $(this).attr('id');
}).get();

var allCommands = {
    "cat" :  function(vars){
         if(vars.length == 0)
            return;
         
         for (let f of vars.values()){
             
             if (! files.includes(f))
                return "cat: "+f+": no such file or directory";

             terminal.append($(".data > #files > #"+f.replace('.','\\.')).html());
         }
         return;
    },
    "clear" : function(vars){
        terminal.empty();
        return "";
    },
    "help" : function(vars) {
        var response = "List of available commands:\n";
        response += Object.keys(allCommands).join("\n");
        return response;
    },
    "history" : function(vars) {
        var response = "";
        var len = commandHistory.length;
        var count = (len.toString().match(/\d/g) || []).length
        var i = 1;
        commandHistory.forEach(function(command){
            response += (i++).toString().padStart(count,' ') + "&nbsp;&nbsp;" +command +"\n";
        });
        return response;  
    },
    "ls" : function(vars) {
        if (vars.length != 0 && (homePaths.indexOf(vars[0]) == -1)){
            return "ksh: Permission denied !!"; 
        }
        return files.join("\n")  
    },
    "ping" : function(vars){
        return "pong!!";
    },
    "pwd" : function(vars){
        return "/root";
    },
    "sudo" : function(vars) {
        return "Oops!! You are already 'root'. Remember, with great power comes great responsibility.";
    },
    "which" : function(vars){
        if (vars.length == 0)
            return;
        if (vars[0] in allCommands){
            return "/bin/"+vars[0];
        }
        return vars[0] +" not found";
    },
    "whoami" : function(vars){
        return "root";
    }
}

function printLine(text){
    if (!text)
        return;
    var lines = text.split("\n");
    lines.forEach(line => {
        terminal.append("<div class='line'>"+line.replace(' ',"&nbsp;")+"</div>");
    });
}

function showPrompt(){
    $("#terminal").stop().animate({
      scrollTop: $("#terminal")[0].scrollHeight
    }, 300);
    var time = Date().match("[0-9]+:[0-9]+:[0-9]+")[0];
    $(".prompt").last().find(".cursor").remove();
    terminal.append("<div class='prompt'><span class='host'>localhost</span><span class='folder'>~</span><span class='user'>root</span><span class='text'></span><span class='cursor'></span><span class='time'>"+time+"</span></div>");
}

function executeCommand(command){
    if (command == ""){
        showPrompt();
        return;
    }
    commandHistory.push(command);
    currentHistoryPosition = commandHistory.length;
    var commandAsArray = command.split(" ");
    var commandFunction = allCommands[commandAsArray[0]];
    if (commandFunction == undefined){
        printLine("ksh: command not found: " + commandAsArray[0] );
    }else{
        parameters = commandAsArray.slice(1);
        expandedParameters = [];
        for (let p of parameters.values()){
            if (p.indexOf("*") > -1){
                query = p.replace('.','\\.').replace('*','.*');
                filtered_files = files.filter((f) => { return f.match(query) });
                $.merge(expandedParameters,filtered_files);
            }else{
                expandedParameters.push(p);
            }
        }
        var response = commandFunction(expandedParameters);
        if (response != "")
            printLine(response);
    }
    showPrompt();
}

$(window).on("keydown",function (key) {
    var text = $(".prompt").last().find(".text");
    if (key.key.length > 1){
        if (key.key == "Enter"){
            query = text.html().replace(/(?:&nbsp;){1,}/g," ").trim();
            executeCommand(query);
        }else if (key.key == "Backspace"){
            var length = text.html().length;
            var end = (text.html().endsWith("&nbsp;")) ? text.html().lastIndexOf("&nbsp;") : -1;
            text.html(text.html().slice(0,end));
        }else if (key.key == "ArrowUp"){
            currentHistoryPosition -= 1;
            if(currentHistoryPosition <= 0){
                currentHistoryPosition = 0;
            }
            text.html(commandHistory[currentHistoryPosition]);
        }else if (key.key == "ArrowDown"){
            currentHistoryPosition += 1;
            if(currentHistoryPosition == commandHistory.length){
                currentHistoryPosition -= 1;
            }
            text.html(commandHistory[currentHistoryPosition]);
        }else if (key.key == "Tab"){
            var commandAsArray = text.html().replace(/(?:&nbsp;){1,}/g," ").split(" ");
            if(commandAsArray.length == 1){
                for (command in allCommands){
                    if (command.startsWith(commandAsArray[0])){
                        text.html(command);
                        break;
                    }   
                }  
            }else{
                filtered_files = files.filter((f) => { return f.startsWith(commandAsArray[commandAsArray.length - 1]) });
                if (filtered_files.length > 0){
                    commandAsArray[commandAsArray.length - 1] = filtered_files[0];
                    text.html(commandAsArray.join("&nbsp;"));
                }
            }
        }
    }else{
        var keyval = key.key;
        if(key.shiftKey) keyval = keyval.toUpperCase();
        if (keyval == ' ')
            keyval = "&nbsp;"
        text.html(text.html() + keyval);
    }
    key.preventDefault();  
});

showPrompt();