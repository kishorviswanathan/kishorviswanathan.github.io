var commands = {

  // cat <path> : Print content of file 
  "cat": function (vars) {
    var errors = [];
    if (vars.length == 0)
      return "cat: No file specified.";

    var results = "";
    for (let filePath of vars.values()) {
      var fileObject = getFile(filePath);

      if (!fileObject) {
        errors.push("cat: " + filePath + ": no such file or directory");
        continue;
      }

      if (fileObject.isDir) {
        errors.push("cat: " + filePath + ": Is a directory");
        continue;
      }

      results += hljs.highlight(
        fileObject.type,
        fileObject.content
      ).value.replace(/\n/g, '<br/>\n');
    }
    // If there are errors, print errors first and then output
    if (errors.length > 0) {
      printLine(errors.join("\n"), () => {
        printHtml(results, showPrompt);
      });
    } else {
      printHtml(results, showPrompt);
    }
    return;
  },

  // cd [path] : Change directory
  "cd": function (vars) {
    var directory = vars.length == 1 ? vars[0] : "/home/" + user;
    var fileObject = getFile(directory);
    if (!fileObject) {
      return "cd: no such file or directory: " + directory;
    }
    if (fileObject.isDir) {
      currentDir = fileObject.path;
      return "";
    }
    return "cd: not a directory: " + directory;
  },

  // clear : Clear screen
  "clear": function (vars) {
    terminal.empty();
    showPrompt();
    return;
  },

  // help : Show a list of available commands
  "help": function (vars) {
    var response = "Available commands:\n";
    response += Object.keys(commands).join("\n");
    return response;
  },

  // history [-c] : Show command history
  "history": function (vars) {
    if (vars.length != 0) {
      if (vars[0] == "-c" || vars[0] == "clear") {
        commandHistory = [];
        commandHistory.length = 0;
        localStorage.setItem("history", "");
        return "";
      }
      return "zsh: history: Invalid option\nhistory: usage : history [-c|clear]";
    }
    var response = "";
    var len = commandHistory.length;
    var count = (len.toString().match(/\d/g) || []).length
    var i = 1;
    commandHistory.forEach(function (command) {
      response += (i++).toString().padStart(count, ' ') + "  " + command + "\n";
    });
    return response;
  },

  // ls [path] : Show contents of a directory
  "ls": function (vars) {
    var directory = (vars.length == 1) ? vars[0] : currentDir;
    var fileObject = getFile(directory);
    if (fileObject) {
      if (fileObject.isDir) {
        var result = "";
        for (const [key, value] of Object.entries(fileObject.children)) {
          result += `<span class='${value == "dir" ? "blue" : ""}'>${key}</span>  `;
        }
        printHtml(result, showPrompt);
        return;
      }
      return fileObject.path;
    }
    return `ls: cannot access '${directory}': No such file or directory`;
  },

  // neofetch : Show some details in a fansy style
  "neofetch": function (vars) {
    var output = ["<img class='dp' src='./images/dp.png' />",
      "<p class='green'>Information</p>",
      "<p>-----------------------</p>"];

    config.commandOptions.neofetch.forEach((item) => {
      output.push(`<p><span class='yellow'>${item.title}:</span> ${item.value}</p>`);
    });

    output.push(`<p><span class='yellow'>Last Updated:</span> ${lastCommitDate}</p>`);

    colorPalette.forEach((color) => {
      output.push(`<div class='palette-block bg-${color}'></div>`);
    });

    output.push("<br/><br/>");

    printHtml(output.join("\n"), showPrompt);
    return;
  },

  // ping : Prints "pong!!"
  "ping": function (vars) {
    return "pong!!";
  },

  // pwd : Shows the current directory
  "pwd": function (vars) {
    return currentDir;
  },

  // sudo <cmd> : Run command as root 
  "sudo": function (vars) {
    return "'" + user + "' is not in the sudoers file.";
  },

  // which <cmd> : Show the location of a binary
  "which": function (vars) {
    if (vars.length == 0)
      return "";
    if (vars[0] in commands) {
      return "/bin/" + vars[0];
    }
    return vars[0] + " not found";
  },

  // whoami : Print current username
  "whoami": function (vars) {
    return user;
  }
}