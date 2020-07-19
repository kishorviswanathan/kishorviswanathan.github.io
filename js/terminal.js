var terminal = $("#terminal");
var commandHistory = [];
var currentHistoryPosition = null;
var homePaths = ["~",".","./","~/", "/home/user/", "/home/user"];
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
    "cd" : function(vars){
        if (vars.length != 0 && (homePaths.indexOf(vars[0]) == -1)){
            return "zsh: Permission denied !!"; 
        }
        return;
    },
    "clear" : function(vars){
        terminal.empty();
        return "";
    },
    "help" : function(vars) {
        var response = "Available commands:\n";
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
            return "zsh: Permission denied !!"; 
        }
        return files.join("\n")  
    },
    "neofetch" : function(vars) {
        terminal.append(`
            <img class='dp' src='./images/dp.png' />
            <div class='info'>
                <p class='green'>Information</p>
                <p>-----------------------</p>
                <p><span class='yellow'>Name:</span> Kishor V</p>
                <p><span class='yellow'>About:</span> Hacker, Coder and Web developer</p>
                <p><span class='yellow'>Email:</span> <a href='mailto:developer.kishor@gmail.com'>developer.kishor@gmail.com</a></p>
                <p><span class='yellow'>Skills:</span> Linux, Android, Python, Web Development</p>
                <p><span class='yellow'>Source Code:</span> <a href='https://gitlab.com/kishorv06/portfolio'>Gitlab</a></p>
                <p><span class='yellow'>Last Updated:</span> 16 July 2020</p>
                <div class='color-pallete'>
                    <div class='bg-black'></div>
                    <div class='bg-red'></div>
                    <div class='bg-green'></div>
                    <div class='bg-yellow'></div>
                    <div class='bg-blue'></div>
                    <div class='bg-white'></div>
                </div>
            </div>
        `);
        return;
    },
    "ping" : function(vars){
        return "pong!!";
    },
    "pwd" : function(vars){
        return "/home/user";
    },
    "sudo" : function(vars) {
        return "'user' is not in the sudoers file.";
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
        return "user";
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
    terminal.append("<div class='prompt'><span class='host'>localhost</span><span class='folder'>~</span><span class='user'>user</span><span class='text'></span><span class='cursor'></span><span class='time'>"+time+"</span></div>");
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
        printLine("zsh: command not found: " + commandAsArray[0] );
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

function isMobileorTablet() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

$( document ).ready(() => {
    $(".loading").addClass("done");
    window.setTimeout(() => {
        terminal.html("");
        if (isMobileorTablet()){
            printLine("zsh: Warning!! Mobile Device detected.\nPlease use a computer for the interactive experience...");
            window.setTimeout(() => {
                terminal.html("");
                executeCommand("neofetch");
            }, 5000);
        }else{
            executeCommand("neofetch");
        }
    }, 2000);
});