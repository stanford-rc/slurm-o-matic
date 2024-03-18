(function($, window) {

  var SlurmOMatic = {
    init: function() {
      //;
      this.renderUI();
    },
    renderUI: function() {
      handleGPU(null);
      var config = {};
      var i;
      var j;
      var queueLength;
      $.getJSON("includes/config.json", function(data) {
        console.log(data);
        config = data;
        queueLength = config.queues.length;
        populateResourceTable(config);
        populateQueueRadio(config);
        populateGpuRadio(config);
        populateModules(config);
        populateResourceDropdowns(config);
        populateTimeDropdowns();
        generateScript();
        return;
      }).fail(function(e) {
        console.log("An error has occurred.", e);
      });

      function populateResourceTable(config) {
        var $tableBody = $('#resource-table tbody');
        for (i = 0; i < queueLength; i++) {
          var tableRow = $('<tr>');
          $("<td>").html(config.queues[i].name).appendTo(tableRow);
          $("<td>").html(config.queues[i].cpu).appendTo(tableRow);
          $("<td>").html(config.queues[i].memory).appendTo(tableRow);
          $("<td>").html(config.queues[i].nodes).appendTo(tableRow);
          $("<td>").html(config.queues[i].gpus).appendTo(tableRow);
          $tableBody.append(tableRow);
        }
      }

      function populateQueueRadio(config) {
        var $queueList = $('#choose-queue');
        //var queueLength = config.queues.length;
        const uniqueArr = [];

        for (i = 0; i < queueLength; i++) {
          if (uniqueArr.indexOf(config.queues[i].name) === -1) {
            uniqueArr.push(config.queues[i].name);
          }
        }
        console.log('uniqueArr', uniqueArr);

        for (i = 0; i < uniqueArr.length; i++) {
          var queueRow = $('<div class="form-check">');
          var queueRadio = $('<input type="radio" class="queue_radio form-check-input" name="queue">');
          queueRadio.val(uniqueArr[i]);
          queueRadio.appendTo(queueRow);
          $('<label class="form-check-label">').html(uniqueArr[i]).appendTo(queueRow);
          $queueList.append(queueRow);
        }
        //select the first radio, so the user doesn't see a bunch of nonsense in the script box
        $('#choose-queue .queue_radio').first().prop("checked", true)
      }

      //This uses the values in config to populate the dropdowns to match the selected queue
      function populateResourceDropdowns(config) {
        var queue = $('.queue_radio:checked').val();
        handleGPU(queue);
        var gpuSpec = $('.gpu-flag-radio:checked').val();
        console.log('this gpu', gpuSpec);
        for (i = 0; i < queueLength; i++) {
          if (config.queues[i].name == queue) {
            if (gpu) {
              if (config.queues[i].gpuId != gpuSpec) {
                continue;
              }
            }

            console.log('config cpu', config.queues[i].cores);
            var cpu = $('#cpu');
            cpu.empty();
            var myCPU = config.queues[i].cores;

            for (j = 1; j <= config.queues[i].cores; j++) {
              cpu.append('<option value="' + j + '">' + j + '</option>');
            }
            var $memory = $('#memory');
            $memory.empty();
            for (j = 1; j <= config.queues[i].memoryNum; j++) {
              $memory.append('<option value="' + j + '">' + j + '</option>');
            }
            var $nodes = $('#nodes');
            $nodes.empty();
            for (j = 1; j <= config.queues[i].nodes; j++) {
              $nodes.append('<option value="' + j + '">' + j + '</option>');
            }

            var $gpugroup = $('#gpu-group');
            if (config.queues[i].gpus) {
              var $gpus = $('#gpu');
              $gpus.empty();
              for (j = 1; j <= config.queues[i].nodes; j++) {
                $gpus.append('<option value="' + j + '">' + j + '</option>');
              }

            }

          }

        }

        generateScript();
      }

      //makes a list of gpus
      function populateGpuRadio(config) {

        var $gpugroup = $('#choose-gpu');
        $gpugroup.empty();
        for (i = 0; i < queueLength; i++) {
          if (config.queues[i].gpuFlag) {
            var gpuFlagRow = $('<div class="form-check"></div>');
            var gpuFlagRadio = $('<input type="radio" class="form-check-input gpu-flag-radio" name="gpuFlag">');
            gpuFlagRadio.val(config.queues[i].gpuId);
            gpuFlagRadio.attr("data-flag", config.queues[i].gpuFlag)

            gpuFlagRadio.appendTo(gpuFlagRow);
            $('<label class="form-check-label">').html(config.queues[i].gpus).appendTo(gpuFlagRow);
          }
          $gpugroup.append(gpuFlagRow);
        }
        //add a "whatever, dude" option
        //$('<div class="form-check"><input type="radio" class="form-check-input gpu-flag-radio" name="gpuFlag" checked="true"><label class="form-check-label">First Available</label></div>').appendTo($gpugroup);
      }

      function handleGPU(queue) {
        console.log('handleGPU', queue);
        if (queue == "gpu") {
          $('.gpu-group').show();
        } else { //unselect/dump gpu options
          $(".gpu-group").hide();
          $(".gpu-flag-radio").prop('checked', false);
          var $gpus = $('#gpu');
          $gpus.empty();
        }
      }

      async function copyTextToClipboard(text) {
        try {
          await navigator.clipboard.writeText(text);
          console.log('Text copied to clipboard', text);
          notifyCopy();
        } catch (err) {
          console.error('Failed to copy: ', err);
        }
      }

      function notifyCopy() {
        console.log('notifyCopy');
        baseWidth = $('#copyBtn').width();
        $('#copyBtn').width(baseWidth);
        copyBling();
        setTimeout(function() {
  // Your jQuery action here
  copyUnBling();
}, 2000); // Delay in milliseconds
      }
      function copyBling(){
        console.log('copyBling');
        $('#copyBtn').addClass('funkytown');
        $('#copyBtn span').text(' Copied!');
        $('#copyBtn i').addClass('fa-beat');
        $('#copyBtn i').addClass('fa-solid fa-clipboard-check');
        $('#copyBtn i').removeClass('fa-regular fa-clipboard');
      }
      function copyUnBling(){
        console.log('copyUnBling');
        $('#copyBtn').removeClass('funkytown');
        $('#copyBtn span').text(' Copy to Clipboard');
        $('#copyBtn i').removeClass('fa-beat');
        $('#copyBtn i').removeClass('fa-solid fa-clipboard-check');
        $('#copyBtn i').addClass('fa-regular fa-clipboard');
      }

      function generateScript() {
        //console.log('generateScript');
        // Grab Queue
        var queue = $('.queue_radio:checked').val();
        var queueStr = "#SBATCH -p " + queue + "\n";

        // Grab resources
        var cpu = $('#cpu').val();
        var memory = $('#memory').val();
        var nodes = $('#nodes').val();
        var runtimeHour = $('#runtimeHr').val();
        var runtimeMinute = $('#runtimeMin').val();
        var runtimeFormat = runtimeHour + ":" + runtimeMinute + ":00";
        //console.log(runtimeFormat);
        var gpu = null;
        gpu = $("#gpu").val();
        var cpuStr = "#SBATCH -n " + cpu + "\n";
        var memStr = "#SBATCH --mem=" + memory + "g\n";
        var nodesStr = "#SBATCH -N " + nodes + "\n";
        var runtimeString = "# Define how long you job will run d-hh:mm:ss\n#SBATCH --time " + runtimeFormat + "\n";
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
        } else {
          $('#modules').select2({
            theme: 'bootstrap4',
            width: 'resolve'
          });
          console.log('script modules were not initialized');
          modules = $('#modules').select2('val');
        }

        //console.log('modules', modules);
        var modulesStr = "";
        if (modules != null) {
          for (i = 0; i < modules.length; i++) {
            modulesStr += "module load " + modules[i].replace(/\(default\)/, "") + "\n";
          }
        }

        // Grab commands
        var commands = $('#commands').val();
        //console.log('commands', commands);
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
        $('#slurm').height('auto').empty();
        $('#slurm').val(script);
        var slurmHeight = $('#slurm').height();
        console.log('slurmheight', slurmHeight);
        var scroll = $('#slurm').prop('scrollHeight');
        console.log('scroll', scroll);
        if (slurmHeight != "auto") {
          if (scroll > slurmHeight) {
            console.log('fixing slurmHeight',scroll);
            $('#slurm').height(scroll + "px");
          }
        }

      }

      function hasClass(elem, className) {
        return elem.classList.contains(className);
      }

      function populateTimeDropdowns() {
        console.log("populateTimeDropdowns");
        var runtimeDefault = 2;
        var display;
        var selectedString;
        var runtimeHr = $('#runtimeHr');
        runtimeHr.empty();
        for (j = 0; j <= 11; j++) {
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
      }

      function generateTips() {
        var sunetid = $('#sunetid').val();
        var jobid = $('#jobid').val();
        var slurmStatus = $('#slurmStatus');
        var slurmGpuUtil = $('#slurmGpuUtil');
        if (sunetid) {
          console.log("has sunet");
          slurmStatus.empty();
          var statusCommand = "squeue -u " + sunetid;
          slurmStatus.val(statusCommand)
        }
        if (jobid) {
          console.log("has jobid");
          slurmGpuUtil.empty();
          var slurmGpuUtilCommand = "srun --jobid= " + jobid + " --pty bash nvidia-smi";
          slurmGpuUtil.val(slurmGpuUtilCommand)
        }
      }

      function populateModules(config) {
        var moduleSelect = $('#modules');
        var modListPath = config.config.apps_url;
        console.log('modListPath', modListPath);
        fetch(modListPath)
          .then(response => response.text())
          .then((data) => {
            //console.log(data);
            $.each(data.split(/[\n\r]+/), function(index, line) {
              const regex = new RegExp('^.*\/$');
              if (regex.test(line)) {
                //console.log('rejected', line);
              } else {
                //console.log('kept', line);
                moduleSelect.append('<option value="' + line + '">' + line + '</option>');
              }
            });
            $('#modules').select2({
              theme: 'bootstrap4',
              width: 'resolve'
            });
            if ($('#modules').hasClass("select2-hidden-accessible")) {
              console.log('populateModules modules initialized');
            } else {
              console.log('populateModules modules not initialized');
            }
            //TODO: move this
            moduleSelect.on('select2:select', function(e) {
              //var modules = $('#modules').select2('val');
              generateScript();
            });
            //TODO: move this
            var commandTextArea = $('#commands');
            $("#commands").on('input', function() {
              generateScript();
            });
            //TODO: move this
            $("#copyBtn").click(function() {
              var textToCopy = $("#slurm");
              var text = textToCopy.val();
              copyTextToClipboard(text);
            })
            $("#copyStatusBtn").click(function() {
              var textToCopy = $("#slurmStatus");
              var text = textToCopy.val();
              copyTextToClipboard(text);
            })
          })
      }
      $(document).on('input', '.autoresizing', function(e) {
        generateScript();
        console.log('textarea', e);
        this.style.height = 'auto';
        console.log('autoresize height', this.style.height);
        this.style.height =
          (this.scrollHeight) + 'px';
        console.log('scroll', this.scrollHeight);
      });

      document.addEventListener('change', function(e) {
        var node = e.target;
        const parent = node.closest('.slurm-form');
        if (hasClass(node, 'queue_radio')) {
          var selected_value = $(".queue_radio:checked").val();
          console.log('selected_value', selected_value);
          populateResourceDropdowns(config);
          handleGPU(selected_value);
          generateScript();
        }
        if (hasClass(node, 'gpu-flag-radio')) {
          var selected_value = $(".gpu-flag-radio:checked").val();
          populateResourceDropdowns(config);
          generateScript();
        } else {
          generateScript();
          generateTips();
        }
      }, false);

    }, //end renderUI

  }; //end SlurmOMatic
  window.addEventListener("load", SlurmOMatic.init());

}(jQuery, window));