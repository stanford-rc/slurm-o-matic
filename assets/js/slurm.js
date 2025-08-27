(function($, window) {

  var SlurmOMatic = {
    init: function() {
      //;
      this.renderUI();
    },
    renderUI: function() {
      var config = {};
      var i;
      var j;
      var queueLength;
      var resourceTable = $("#resource-table");

      $.getJSON("includes/config.json", function(data) {
        config = data;
        queueLength = config.queues.length;

        populateResourceTable(config);
        populateQueueRadio(config);
        populateModules(config);

        populateResourceDropdowns(config);
        populateDaysDropdown(config);
        populateTimeDropdowns();
        startupCheckSession();
        generateScript();
        bindEvents();
        return;
      }).fail(function(e) {
        //console.log("An error has occurred.", e);
      });

      function populateResourceTable(config) {
        var $tableBody = $('#resource-table tbody');
        //have to have a skeleton row for accessibility, this removes it
        $tableBody.empty();
        for (i = 0; i < queueLength; i++) {
          if (config.queues[i].showTable) { //skip if this is fake
            var tableRow = $('<tr>');
            $("<td>").html(config.queues[i].name).appendTo(tableRow);
            $("<td>").html(config.queues[i].cpu).appendTo(tableRow);
            $("<td>").html(config.queues[i].memory).appendTo(tableRow);
            $("<td>").html(config.queues[i].displayNodes).appendTo(tableRow);
            $("<td>").html(config.queues[i].gpus).appendTo(tableRow);
            $tableBody.append(tableRow);
          }
          collapseResourceTableSession()
        }

      }

      function collapseResourceTableSession() {
        var tableToggle = checkSession('table-toggle');
        var tableToggleIcon = $('.table-toggle i');
        var showIcon = "fa-plus";
        var hideIcon = "fa-minus";
        if (tableToggle == "collapsed") {
          resourceTable.hide();
          tableToggleIcon.addClass(showIcon).removeClass(hideIcon);
        } else { //show it
          resourceTable.show();
          tableToggleIcon.addClass(hideIcon).removeClass(showIcon);
        }
      }

      function populateQueueRadio(config) {
        //check the session
        var sessionRadio = checkSession('choose-queue');
        var $queueList = $('#choose-queue');
        $queueList.empty();
        const uniqueArr = [];
        for (i = 0; i < queueLength; i++) {
          if (uniqueArr.indexOf(config.queues[i].name) === -1) {
            uniqueArr.push(config.queues[i].name);
          }
        }

        for (i = 0; i < uniqueArr.length; i++) {
          var queueRow = $('<div class="form-check">');
          var queueRadio = $('<input type="radio" class="queue_radio form-check-input" name="queue">');
          var radioValue = uniqueArr[i];
          var radioId = radioValue.replace(/\s+/g, '-').toLowerCase();
          queueRadio.val(radioValue);
          queueRadio.prop('id', 'queue-' + i);
          if (radioValue == sessionRadio) {
            queueRadio.prop('checked', true);
          }
          queueRadio.appendTo(queueRow);
          $('<label class="form-check-label mt-2">').prop('for', 'queue-' + i).html(uniqueArr[i]).appendTo(queueRow);
          $queueList.append(queueRow);
        }
        //if no session info, select the first radio so the user doesn't see a bunch of nonsense in the script box
        if (!sessionRadio) {
          $('#choose-queue .queue_radio').first().prop("checked", true);
        }
      }

    
      // Populates the "Days" dropdown based on the config
      function populateDaysDropdown(config) {
        var dayLimit = config.config.longQueueRuntimeLimitDays || 7; // Default to 7 if not in config
        var runtimeDay = $('#runtimeDay');
        runtimeDay.empty();
        for (var j = 0; j <= dayLimit; j++) {
            runtimeDay.append('<option value="' + j + '">' + j + '</option>');
        }
      }

      function populateResourceDropdowns(config) {
        var queue = $('.queue_radio:checked').val();
        handleGPU(queue); // This sets up the GPU radio buttons if needed.
        var gpuSpec = $('.gpu-flag-radio:checked').val(); // This will be the gpuId or "None".

        var isGpuQueue = !!gpuSpec;

        if (isGpuQueue && gpuSpec === "None") {
          // Handle "No preference" for a GPU queue by reading data attributes from the radio button.
          var noPrefRadio = $('.gpu-flag-radio:checked');
          populateCores(noPrefRadio.data('cores-limit'));
          populateMemory(noPrefRadio.data('memory-num'));
          populateNodes(noPrefRadio.data('nodes'));
          saveToSession('nodeTotal', noPrefRadio.data('nodes'));
          populateGpus(noPrefRadio.data('gpu-number'));
        } else {
          // This handles both a specific GPU model and any non-GPU partition.
          for (i = 0; i < config.queues.length; i++) {
            var currentQueueConfig = config.queues[i];

            // Condition 1: Partition names must match.
            if (currentQueueConfig.name !== queue) {
              continue;
            }

            // Condition 2: Match the specific configuration.
            if (isGpuQueue) {
              // For a GPU partition, the gpuId must also match.
              if (currentQueueConfig.gpuId !== gpuSpec) {
                continue;
              }
            } else {
              // For a non-GPU partition, we need the config entry that has NO GPU info.
              if (currentQueueConfig.gpus) {
                continue;
              }
            }

            // Found the unique, correct config entry. Populate dropdowns from it.
            populateCores(currentQueueConfig.coresLimit);
            populateMemory(currentQueueConfig.memoryNum);
            populateNodes(currentQueueConfig.nodes);
            saveToSession('nodeTotal', currentQueueConfig.nodes);

            if (isGpuQueue) {
              populateGpus(currentQueueConfig.gpuNumber);
            }

            // We found our match, no need to loop further.
            break;
          }
        }
      }


      function populateGpus(gpus) {
        var gpuTarget = $('#gpu');
        var gpuSpan = $('#gpuRange');
        gpuTarget.empty();
        for (j = 1; j <= gpus; j++) {
          gpuTarget.append('<option value="' + j + '">' + j + '</option>');
        }
        gpuSpan.text(" up to " + gpus);
      }

      function populateCores(limit) {
        var cpu = $('#cpu');
        var cpuSpan = $('#coreRange');
        var nodeQuantity = checkSession('nodes');
        if (!nodeQuantity) {
          nodeQuantity = 1;
          saveToSession('nodes', 1);
        }
        saveToSession('coresLimit', limit);
        var coresCalc = nodeQuantity * limit;
        cpu.empty();
        for (j = 1; j <= coresCalc; j++) {
          cpu.append('<option value="' + j + '">' + j + '</option>');
        }
        cpuSpan.text(" up to " + coresCalc);
        var cpuHelp = $('#cpuHelp');
        var nodeTotal = checkSession('nodeTotal');
        var getMoreNodes = "";
        if (nodeQuantity < nodeTotal) {
          getMoreNodes = ", increase nodes for more CPUs"
        }
        if (limit) {
          $('#cpuHelp').text("limit of " + limit + " CPUs per node" + getMoreNodes);
        }
      }

      function populateNodes(nodes) {
        var $nodes = $('#nodes');
        var nodeSpan = $('#nodeRange');
        $nodes.empty();
        for (j = 1; j <= nodes; j++) {
          $nodes.append('<option value="' + j + '">' + j + '</option>');
        }
        nodeSpan.text(" up to " + nodes);
      }

      function populateMemory(memory) {
        var $memory = $('#memory');
        $memory.empty();
        $memory.append('<option value="' + "500M" + '">.5 (500MB)</option>');
        for (j = 1; j <= memory; j++) {
          $memory.append('<option value="' + j + 'G">' + j + '</option>');
        }
        $($memory).val("1G");
      }

      function populateGpuRadio(config, queueName) {
        var $gpugroup = $('#choose-gpu');
        $gpugroup.empty(); // Clear previous options

        // Filter for GPU models of the specific queue
        var gpuModelsForQueue = config.queues.filter(function(q) {
          return q.name === queueName && q.gpus;
        });

        gpuModelsForQueue.forEach(function(queueConfig, i) {
          var gpuFlagRow = $('<div class="form-check"></div>');
          var gpuFlagRadio = $('<input type="radio" class="form-check-input gpu-flag-radio" name="gpuFlag">');
          var radioValue = queueConfig.gpuId.replace(/\s+/g, '-').toLowerCase();
          var gpuFlagRadioId = ('gpu-' + radioValue);
          gpuFlagRadio.val(radioValue);
          gpuFlagRadio.attr("data-flag", queueConfig.gpuFlag).prop('id', gpuFlagRadioId);
          gpuFlagRadio.appendTo(gpuFlagRow);
          $('<label class="form-check-label mt-2">').prop('for', gpuFlagRadioId).html(queueConfig.gpus).appendTo(gpuFlagRow);
          $gpugroup.append(gpuFlagRow);
        });

        // After adding specific models, add the "No preference" option.
        addNoPreferenceGpuOption(config, queueName);
      }

      function addNoPreferenceGpuOption(config, queueName) {
        var $gpugroup = $('#choose-gpu');
        var gpuModelsForQueue = config.queues.filter(function(q) {
          return q.name === queueName && q.gpus;
        });

        if (gpuModelsForQueue.length === 0) {
          return; // No GPU models for this queue, so no "No preference" option needed.
        }

        // Calculate the most permissive specs by finding the max values across all models for this partition.
        var max = { mem: 0, nodes: 0, gpuNum: 0, cores: 0, coresLim: 0 };
        gpuModelsForQueue.forEach(function(model) {
            if (model.memoryNum > max.mem) max.mem = model.memoryNum;
            if (model.nodes > max.nodes) max.nodes = model.nodes;
            if (model.gpuNumber > max.gpuNum) max.gpuNum = model.gpuNumber;
            if (model.cores > max.cores) max.cores = model.cores;
            if (model.coresLimit > max.coresLim) max.coresLim = model.coresLimit;
        });

        // Create the "No preference" radio button
        var gpuFlagRow = $('<div class="form-check"></div>');
        var gpuFlagRadio = $('<input type="radio" class="form-check-input gpu-flag-radio" name="gpuFlag">');
        var radioId = queueName + '-no-preference';

        gpuFlagRadio.val("None"); // Special value to identify this option
        gpuFlagRadio.prop('id', radioId);

        // Store permissive specs as data attributes to be read later
        gpuFlagRadio.attr('data-memory-num', max.mem);
        gpuFlagRadio.attr('data-nodes', max.nodes);
        gpuFlagRadio.attr('data-gpu-number', max.gpuNum);
        gpuFlagRadio.attr('data-cores', max.cores);
        gpuFlagRadio.attr('data-cores-limit', max.coresLim);

        gpuFlagRadio.appendTo(gpuFlagRow);
        $('<label class="form-check-label mt-2">').prop('for', radioId).html("No preference").appendTo(gpuFlagRow);
        $gpugroup.append(gpuFlagRow);
      }

      function handleRuntimeUI(queueName) {
        if (queueName === 'gpu-long') {
            $('.runtime-days-group').show();
            // Update the help text
            var dayLimit = config.config.longQueueRuntimeLimitDays || 7;
             $('#runMax').text('Limit ' + dayLimit + ' days');
        } else {
            $('.runtime-days-group').hide();
            // Reset the day value to 0 to prevent it from being used for other queues
            $('#runtimeDay').val('0').trigger('change.select2');
            // Revert help text
            $('#runMax').text('Limit ' + config.config.runtimeLimit + ' hours');
        }
      }

      function handleGPU(queue) {
        // Determine if the selected queue has any GPU options in the config.
        var isGpuQueue = config.queues.some(function(q) {
          return q.name === queue && q.gpus;
        });

        if (isGpuQueue) {
          $('.gpu-group').show();
          populateGpuRadio(config, queue); // Populate radios specifically for this partition.

          // Check session for a saved preference for THIS partition, otherwise default to "No preference".
          var sessionRadioVal = checkSession('gpu_constraint');
          var radioToCheck = sessionRadioVal ? $('input[name="gpuFlag"][value="' + sessionRadioVal + '"]') : $('#choose-gpu .gpu-flag-radio').last();

          if (radioToCheck.length) {
            radioToCheck.prop("checked", true);
          } else if ($(".gpu-flag-radio:checked").length === 0) {
            // Fallback if session value is invalid or not found.
            $('#choose-gpu .gpu-flag-radio').last().prop("checked", true);
          }
        } else {
          // If not a GPU partition, hide the section and clear any selections.
          $(".gpu-group").hide();
          $('#choose-gpu').empty(); // Clear out old radio buttons
          $('#gpu').empty(); // Clear GPU count dropdown
        }
      }


      async function copyTextToClipboard(text) {
        try {
          await navigator.clipboard.writeText(text);
          //console.log('Text copied to clipboard', text);
          notifyCopy();
        } catch (err) {
          console.error('Failed to copy: ', err);
        }
      }

      function notifyCopy() {
        //console.log('notifyCopy');
        baseWidth = $('#copyBtn').width();
        $('#copyBtn').width(baseWidth);
        copyBling();
        setTimeout(function() {
          copyUnBling();
        }, 1000); // Delay in milliseconds
      }

      function copyBling() {
        //console.log('copyBling');
        $('#copyBtn').addClass('funkytown');
        $('.fancy-copy').addClass('copied');
        $('#copyBtn span').text(' Copied!');
        $('#copyBtn i').addClass('fa-beat');
        $('#copyBtn i').addClass('fa-solid fa-clipboard-check');
        $('#copyBtn i').removeClass('fa-regular fa-clipboard');
      }

      function copyUnBling() {
        //console.log('copyUnBling');
        $('#copyBtn').removeClass('funkytown');
        $('.fancy-copy').removeClass('copied');
        $('#copyBtn span').text(' Copy to Clipboard');
        $('#copyBtn i').removeClass('fa-beat');
        $('#copyBtn i').removeClass('fa-solid fa-clipboard-check');
        $('#copyBtn i').addClass('fa-regular fa-clipboard');
      }

      function generateScript() {
        // Grab Queue
        var queue = $('.queue_radio:checked').val();
        var queueStr = "#SBATCH --partition=" + queue + "\n";

        // Grab resources
        var cpu = getFancyDropdown('#cpu');
        var memory = getFancyDropdown('#memory');
        var nodes = getFancyDropdown('#nodes');
        
        var runtimeHour = getFancyDropdown('#runtimeHr');
        var runtimeMinute = getFancyDropdown('#runtimeMin');
        var day = getFancyDropdown('#runtimeDay');
        // Conditionally format the runtime string
        var runtimeFormat;
        if (day && parseInt(day, 10) > 0) {
            runtimeFormat = day + "-" + runtimeHour + ":" + runtimeMinute + ":00";
        } else {
            runtimeFormat = runtimeHour + ":" + runtimeMinute + ":00";
        }
        
        var runtimeString = "# Define how long the job will run d-hh:mm:ss\n#SBATCH --time=" + runtimeFormat + "\n";

        var gpu = null;
        gpu = $("#gpu").val();
        var cpuStr = "#SBATCH --ntasks=" + cpu + "\n";
        var memStr = "#SBATCH --mem=" + memory + "\n";
        var nodesStr = "#SBATCH --nodes=" + nodes + "\n";
        var runtimeString = "# Define how long the job will run d-hh:mm:ss\n#SBATCH --time=" + runtimeFormat + "\n";
        var gpuStr = "";
        if (gpu != null) {
          gpuStr = "#SBATCH --gres=gpu:" + gpu + "\n";
        }
        var gpuFlagStr = "";
        var gpuFlag = $('.gpu-flag-radio:checked').attr("data-flag");
        if (gpuFlag) {
          gpuFlagStr = gpuFlag + "\n";
        }
        // Grab modules
        var modules;
        if ($('#modules').hasClass("select2-hidden-accessible")) {
          modules = $('#modules').select2('val');
        } else { //gotta init select2
          $('#modules').select2({
            theme: 'bootstrap4', // Use bootstrap-5 for compatibility
            width: 'resolve',
            multiple: true
          });
          modules = $('#modules').select2('val');
        }

        var modulesStr = "";
        if (modules != null) {
          for (i = 0; i < modules.length; i++) {
            modulesStr += "module load " + modules[i].replace(/\(default\)/, "") + "\n";
          }
        }

        // Grab commands
        var commands = $('#commands').val();
        var commandsStr = commands + "\n";

        // Recommended settings
        var sunetid = $('#sunetid').val();
        var jobname = $('#jobname').val();
        var workingdir = $('#workingdir').val();
        var email = sunetid + "@stanford.edu";
        var emailStr = sunetid == "" ? "" : "# Get email notification when job finishes or fails\n#SBATCH --mail-user=" + email + "\n#SBATCH --mail-type=END,FAIL\n";
        var jobnameStr = jobname == "" ? "" : "# Give your job a name, so you can recognize it in the queue overview\n#SBATCH -J " + jobname + "\n";
        var workingdirStr = workingdir == "" ? "" : "#SBATCH -D " + workingdir + "\n";

        // Optional settings
        var stdout = $('#stdout').val();
        var stderr = $('#stderr').val();

        var stdoutStr = stdout == "" ? "" : "#SBATCH -o " + stdout + "\n";
        var stderrStr = stderr == "" ? "" : "#SBATCH -e " + stderr + "\n";

        var script = "#!/bin/bash\n" +
          "# ----------------SLURM Parameters----------------\n" +
          queueStr +
          gpuFlagStr +
          cpuStr +
          memStr +
          gpuStr +
          nodesStr +
          runtimeString +
          emailStr +
          jobnameStr +
          workingdirStr +
          stdoutStr +
          stderrStr +
          "# ----------------Load Modules--------------------\n" +
          modulesStr +
          "# ----------------Commands------------------------\n" +
          commandsStr;
        //make size of textarea auto-grow
        $('#slurm').height('auto').empty();
        $('#slurm').val(script);
        var slurmHeight = $('#slurm').height();
        var scroll = $('#slurm').prop('scrollHeight');
        if (slurmHeight != "auto") {
          if (scroll > slurmHeight) {
            $('#slurm').height(scroll + "px");
          }
        }
        //add narrative
        populateNarrative(nodes, cpu, memory, runtimeHour, runtimeMinute, gpu, queue, jobname, sunetid, stdout, stderr, workingdir, day);
        $('#workingdir').val(workingdir);

      }

      function populateNarrative(nodes, cpu, mem, hour, min, gpu, queue, jobname, sunetid, stdout, stderr, workingdir, day) {
        var narrative = $('#narrative');
        narrative.empty();
        var squeueString = "";
        var emailString = "";
        var outputString = "";
        var output = "";
        var jobHelpString = "";
        if (jobname) {
          jobname = " (" + jobname + ") ";
        }
        if (sunetid) {
          var email = sunetid + "@stanford.edu";
          //          emailString = `<p>You will be notified at ${email} when the job ends or fails. </p>`;
          emailString = "";
          squeueString = "<code>squeue -u " + sunetid + "</code>";
          jobHelpString = `<p>After you have submitted this script, look for your job ${jobname} using the terminal command ${squeueString}</p>`
        }
        if (workingdir) {
          //need a trailing /
          workingdir += workingdir.endsWith("/") ? "" : "/"
          output = "in " + workingdir;
        }

        if (stdout) {
          stdout = workingdir + stdout
          output = stdout
        }

        if (stderr) {
          stderr = workingdir + stderr;
          if (stdout) {
            output = stdout + " and " + stderr;
          } else {
            output = stderr;
          }
        }
        if (output) {
          outputString = `<p>Your output files will be ${output}.</p>`
        }

        if (nodes) {
          nodes = isOne(nodes, "node", "nodes");
        }
        if (cpu) {
          cpu = isOne(cpu, "CPU", "CPUs");
        }
        var gpuString = "";
        if (gpu) {
          gpu = isOne(gpu, "GPU", "GPUs");
          gpuString = gpu + ",";
        }
        var partitionString = "";
        if (queue) {
          partitionString = " on the " + queue + " partition.</p> ";
        }
        var introString = "<p>This script requests "
        var nodeString = nodes + ", ";
        var cpuString = "with " + cpu + ", ";
        var memString = " and " + mem + "B of memory ";

        // Robustly build the time string
        var timeParts = [];
        if (day && parseInt(day, 10) > 0) {
            timeParts.push(isOne(day, "day", "days"));
        }
        // Only show hours if they are set
        if (hour && parseInt(hour, 10) > 0) {
            timeParts.push(isOne(hour.replace(/^0+/, ""), "hour", "hours"));
        }
        // Only show minutes if they are set
        if (min && parseInt(min, 10) > 0) {
            timeParts.push(isOne(min.replace(/^0+/, ""), "minute", "minutes"));
        }
        var timeString = "";
        if (timeParts.length > 0) {
            timeString = "<p>This job will run for up to ";
            if (timeParts.length === 1) {
                timeString += timeParts[0];
            } else if (timeParts.length === 2) {
                timeString += timeParts.join(' and ');
            } else {
                // Handles cases like "1 day, 2 hours, and 30 minutes"
                timeString += timeParts.slice(0, -1).join(', ') + ', and ' + timeParts.slice(-1);
            }
            timeString += ".</p>";
        }
        if (jobname) {
          var jobnameStr = "<p>This job will have the name "
        }

        narrative.empty();
        var narrativeString = introString +
          nodeString +
          cpuString +
          gpuString +
          memString +

          partitionString +
          timeString +
          outputString +
          emailString +
          jobHelpString;
        narrative.html(narrativeString);
      }

      function isOne(string, unit, unitPlural) {
        var singleString
        if (string == "1") {
          singleString = "a single " + unit;
          if (unit == "hour") {
            singleString = "an " + unit;
          }
          if (unit == "minute") {
            singleString = "1 " + unit;
          }
        } else {
          singleString = string + " " + unitPlural
        }
        return singleString;
      }

      function hasClass(elem, className) {
        return elem.classList.contains(className);
      }

      function populateTimeDropdowns() {
        //get the max runtime and subtract 1 to prevent a limit of 24 hours and a runtime of 48:59. Max hour/min will be 47:59
        var runtimeMax = config.config.runtimeLimit
        var runtimeMaxHour = config.config.runtimeLimit - 1;
        var runtimeDefault = 2;
        var display;
        var selectedString;
        var runtimeHr = $('#runtimeHr');
        runtimeHr.empty();
        for (j = 0; j <= runtimeMaxHour; j++) {
          selectedString = (j == runtimeDefault) ? " selected" : "";
          //handle single-digit numbers
          display = (j > 9) ? j : "0" + j;
          runtimeHr.append('<option value="' + display + '"' + selectedString + '>' + display + '</option>');
        }

        var runtimeMin = $('#runtimeMin');
        runtimeMin.empty();
        for (j = 0; j < 60; j++) {
          display = (j > 9) ? j : "0" + j;
          runtimeMin.append('<option value="' + display + '">' + display + '</option>');
        }
        var runMaxSpan = $('#runMax');
        runMaxSpan.text('Limit ' + runtimeMax + ' hours')

        $('.fancy-dropdown').select2({
          theme: 'bootstrap-5',
          width: 'resolve',
        });
        $('.fancy-dropdown').on('select2:select', function(e) {
          generateScript();
          getSaveData(e.currentTarget);
        });
      }
      //integrating a session check
      function populateModules(config) {
        var moduleSelect = $('#modules');
        moduleSelect.empty();
        var modListPath = config.config.apps_url;
        var sessionModules = checkSession('modules');
        var sessionModulesArray;
        if (sessionModules) {
          sessionModulesArray = sessionModules.split(",");
        }
        var selectedModule = "";
        const regex = new RegExp('^.*\/$');
        fetch(modListPath)
          .then(response => response.text())
          .then((data) => {
            $.each(data.split(/[\n\r]+/), function(index, line) {
              selectedModule = "";
              if (regex.test(line)) {} else {
                if ($.inArray(line, sessionModulesArray) != -1) {
                  //console.log('match', line);
                  selectedModule = "selected";
                }
                moduleSelect.append('<option ' + selectedModule + ' value="' + line + '">' + line + '</option>');
              }
            });
            $('#modules').select2({
              theme: 'bootstrap-5',
              width: 'resolve',
              multiple: true
            });

            generateScript();

          })
      }
      $(document).on('input', '.autoresizing', function(e) {
        generateScript();
        this.style.height = 'auto';
        this.style.height =
          (this.scrollHeight) + 'px';
      });

      //This is to prevent an error from trying to access the value of a fancy dropdown that hasn't initialized
      function getFancyDropdown(element) {
        var value;
        if ($(element).hasClass("select2-hidden-accessible")) {
          value = $(element).select2('val');
        } else {
          value = $(element).val();
        }
        return value;
      }

      function checkSession(field) {
        var fieldValue = sessionStorage.getItem(field);
        if (fieldValue) {
          return fieldValue;
        }
      }

      function startupCheckSession() {
        sessionData = Object(sessionStorage);
        $.each(sessionData, function(k, v) {
          if (k.startsWith('gpu_') || k === 'modules') {
             // Skip these as they are handled contextually
          } else {
            var element = $('#' + k);
            if(element.length) {
                 element.val(v);
                 element.trigger('change');
            }
          }
        });
      }

      function saveToSession(fieldId, fieldValue) {
        if (fieldId.startsWith('gpu-') || fieldId.startsWith('queue-')) {
             // This is to not get randos from partition/gpu radios
        } else {
        sessionStorage.setItem(fieldId, fieldValue);
        }
      }

      function getSaveData(node) {
        fieldId = $(node).attr('id');
        fieldValue = getFancyDropdown('#' + fieldId);
        if (fieldValue) {
          saveToSession(fieldId, fieldValue);
        }
      }

function bindEvents() {
        document.addEventListener('change', function(e) {
            var node = e.target;
            console.log("node",node);
            getSaveData(node);
            //deal with partition radios
            if (hasClass(node, 'queue_radio')) {
                var selected_value = $(node).val();
                handleRuntimeUI(selected_value);
                handleGPU(selected_value);
                populateResourceDropdowns(config);
                saveToSession('choose-queue', selected_value);
                generateScript();
            } else if (hasClass(node, 'gpu-flag-radio')) {
                var selected_value = $(node).val();
                handleRuntimeUI(selected_value);
                saveToSession('gpu_constraint', selected_value);
                populateResourceDropdowns(config);
                generateScript();
            } else {
                generateScript();
            }
        }, false);

        $("#nodes").on('select2:select', function(e) {
          var limit = checkSession('coresLimit');
          populateCores(limit);
        });
        $("#modules").on('select2:select', function(e) {
          generateScript();
          getSaveData(this);
        });
        $("#modules").on('select2:unselect', function() {
          generateScript();
          getSaveData("#modules");
        })
        $("#commands").on('input', function() {
          generateScript();
          getSaveData("#commands");
        });
        $("#copyBtn").click(function() {
          var textToCopy = $("#slurm");
          var text = textToCopy.val();
          copyTextToClipboard(text);
        })
        $("#resetBtn").click(function() {
          sessionStorage.clear();
          location.reload();
        })
        var resourceTableElement = document.getElementById('resource-table');
        if (resourceTableElement) {
            resourceTableElement.addEventListener('hidden.bs.collapse', function(e) {
                sessionStorage.setItem('table-toggle', 'collapsed');
                collapseResourceTableSession();
            });
            resourceTableElement.addEventListener('shown.bs.collapse', function() {
                sessionStorage.setItem('table-toggle', '');
                collapseResourceTableSession();
            });
        }
      }
    }, //end renderUI

  }; //end SlurmOMatic
  window.addEventListener("load", SlurmOMatic.init());

}(jQuery, window));