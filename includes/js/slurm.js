(function($, window) {
  "use strict";

  var SlurmOMatic = {
    init: function() {
      //;
      this.renderUI();
    },
    renderUI: function() {
      handleGPU(null);
      var config = {};
      var queueLength;
      $.getJSON("includes/config.json", function(data) {
        console.log(data);
        config = data;
        queueLength = config.queues.length;
        console.log('ajax length', length);
        populateResourceTable(config);
        populateQueueRadio(config);
        populateResourceDropdowns(config);
        return;
      }).fail(function(e) {
        console.log("An error has occurred.", e);
      });

      function populateResourceTable(config) {
        var $tableBody = $('#resource-table tbody');
        for (var i = 0; i < queueLength; i++) {
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

        for (let i = 0; i < queueLength; i++) {
          if (uniqueArr.indexOf(config.queues[i].name) === -1) {
            uniqueArr.push(config.queues[i].name);
          }
        }
        console.log('uniqueArr', uniqueArr);

        for (var i = 0; i < uniqueArr.length; i++) {
          var queueRow = $('<div class="form-check">');
          var queueRadio = $('<input type="radio" class="queue_radio form-check-input" name="queue">');
          queueRadio.val(uniqueArr[i]);
          queueRadio.appendTo(queueRow);
          $('<label class="form-check-label">').html(uniqueArr[i]).appendTo(queueRow);
          $queueList.append(queueRow);
        }

      }

      function populateResourceDropdowns(config) {

        var queue = $('.queue_radio:checked').val();
        handleGPU(queue);
        for (var i = 0; i < queueLength; i++) {
          if (config.queues[i].name == queue) {
            console.log('this queue', queue);
            console.log('config cpu', config);
            var cpu = $('#cpu');
            cpu.empty();
            var myCPU = config.queues[i].cores;

            for (var j = 1; j <= config.queues[i].cores; j++) {
              cpu.append('<option value="' + j + '">' + j + '</option>');
            }
            var $memory = $('#memory');
            $memory.empty();
            for (var j = 1; j <= config.queues[i].memoryNum; j++) {
              $memory.append('<option value="' + j + '">' + j + '</option>');
            }
            var $nodes = $('#nodes');
            $nodes.empty();
            for (var j = 1; j <= config.queues[i].nodes; j++) {
              $nodes.append('<option value="' + j + '">' + j + '</option>');
            }

            var $gpugroup = $('#gpu-group');
            if (config.queues[i].gpus) {
              var $gpus = $('#gpu');
              $gpus.empty();
              for (var j = 1; j <= config.queues[i].nodes; j++) {
                $gpus.append('<option value="' + j + '">' + j + '</option>');
              }

            }

            var runtimeHr = $('#runtimeHr');
            runtimeHr.empty();
            for (var j = 1; j <= 12; j++) {
              if (j < 10) {
                j = "0" + j;
              }
              runtimeHr.append('<option value="' + j + '">' + j + '</option>');
            }
            var runtimeMin = $('#runtimeMin');
            runtimeMin.empty();
            for (var j = 1; j <= 60; j++) {
              if (j < 10) {
                j = "0" + j;
              }
              runtimeMin.append('<option value="' + j + '">' + j + '</option>');
            }

          }

        }
        //make list of gpus, this is a new loop
        var $gpugroup = $('#choose-gpu');
        $gpugroup.empty();
        for (let i = 0; i < queueLength; i++) {
          if (config.queues[i].gpuFlag) {
            var gpuFlagRow = $('<div class="form-check"></div>');
            var gpuFlagRadio = $('<input type="radio" class="form-check-input gpu-flag" name="gpuFlag">');
            gpuFlagRadio.val(config.queues[i].gpus);
            gpuFlagRadio.attr("data-flag", config.queues[i].gpuFlag)

            gpuFlagRadio.appendTo(gpuFlagRow);
            $('<label class="form-check-label">').html(config.queues[i].gpus).appendTo(gpuFlagRow);
          }
          $gpugroup.append(gpuFlagRow);
        }
        //add a "whatever, dude" option
        $('<div class="form-check"><input type="radio" class="form-check-input gpu-flag" name="gpuFlag" checked="true"><label class="form-check-label">First Available</label></div>').appendTo($gpugroup);
        generateScript();
      }

      function handleGPU(queue) {
        console.log('handleGPU', queue);
        if (queue == "gpu") {
          $('.gpu-group').show();
        } else {
          $('.gpu-group').hide();
        }
      }

      function generateScript() {
        console.log('generateScript');
        // Grab Queue
        var queue = $('.queue_radio:checked').val();
        var queueStr = "#SBATCH -p " + queue + "\n";

        // Grab resources
        var cpu = $('#cpu').val();
        var memory = $('#memory').val();
        var nodes = $('#nodes').val();
        var gpu = null;
        if ($('#gpu-group').css('display') == 'block') { gpu = $('#gpu').val(); }

        var cpuStr = "#SBATCH -n " + cpu + "\n";
        var memStr = "#SBATCH --mem=" + memory + "g\n";
        var nodesStr = "#SBATCH -N " + nodes + "\n";
        var gpuStr = "";
        if (gpu != null) { gpuStr = "#SBATCH --gres=gpu:" + gpu + "\n"; }
        var gpuFlagStr = "";
        var gpuFlag = $('.gpu-flag:checked').attr("data-flag");
        if (gpuFlag) {
          gpuFlagStr = gpuFlag + "\n";
        }
        // Grab modules
        //var modules = $('#modules').select2('val');

        var modulesStr = "";
        if (modules != null) {
          for (var i = 0; i < modules.length; i++) {
            modulesStr += "module load " + modules[i].replace(/\(default\)/, "") + "\n";
          }
        }

        // Grab commands
        var commands = $('#commands').val();

        var commandsStr = commands + "\n";

        // Recommended settings
        var email = $('#email').val();
        var jobname = $('#jobname').val();
        var workingdir = $('#workingdir').val();

        var emailStr = email == "" ? "" : "#SBATCH --mail-user=" + email + "\n#SBATCH --mail-type=ALL\n";
        var jobnameStr = jobname == "" ? "" : "# Give your job a name, so you can recognize it in the queue overview\n#SBATCH -J " + jobname + "\n";
        var workingdirStr = workingdir == "" ? "" : "#SBATCH -D " + workingdir + "\n";

        // Optional settings
        var stdout = $('#stdout').val();
        var stderr = $('#stderr').val();
        var account = $('#project').val();

        var stdoutStr = stdout == "" ? "" : "#SBATCH -o " + stdout + "\n";
        var stderrStr = stderr == "" ? "" : "#SBATCH -e " + stderr + "\n";
        var accountStr = account == "" ? "" : "#SBATCH -A " + account + "\n";

        var script = "#!/bin/bash\n" +
          "# ----------------SLURM Parameters----------------\n" +
          queueStr +
          gpuFlagStr +
          cpuStr +
          memStr +
          gpuStr +
          nodesStr +
          emailStr +
          jobnameStr +
          workingdirStr +
          stdoutStr +
          stderrStr +
          accountStr +
          "# ----------------Load Modules--------------------\n" +
          modulesStr +
          "# ----------------Commands------------------------\n" +
          commandsStr;

        $('#slurm').val(script);
      }

      function hasClass(elem, className) {
        return elem.classList.contains(className);
      }

      document.addEventListener('change', function(e) {
        var node = e.target;
        const parent = node.closest('.slurm-form');
        if (hasClass(node, 'queue_radio')) {
          var selected_value = $(".queue_radio:checked").val();
          console.log('selected_value', selected_value);
          populateResourceDropdowns(config);
          handleGPU(selected_value);
        }
        if (parent) {
          generateScript();
        }
      }, false);
    }, //end renderUI

  }; //end SlurmOMatic
  window.addEventListener("load", SlurmOMatic.init());

}(jQuery, window));