$( document ).ready(function() {

      $(document).on('click', '#generateBtn', function() {
            generateTips();
            console.log("generate button");
});
      $(document).on('click', '.copy,.fa-clipboard', function(e) {
                generateTips();
                copyButton(e);
                console.log("copy button");
    });

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
        }

        function hasClass(elem, className) {
          return elem.classList.contains(className);
        }

function generateUserUtilization(sunetid){
  //sreport cluster UserUtilizationByAccount -T GRES/gpu,cpu,Mem Start=2021-11-1T00:00:00 End=2021-11-30T23:59:59 user=<your-SUNetID>
  var fromDate = $( "#from" ).datepicker( "getDate" );
  fromDate = $.datepicker.formatDate(dateFormat, fromDate);
    var toDate = $( "#to" ).datepicker( "getDate" );
  toDate = $.datepicker.formatDate(dateFormat, toDate);
  if (fromDate,toDate,sunetid){
    console.log("got dates");
  var userUtilizationCommand = "sreport cluster UserUtilizationByAccount -T GRES/gpu,cpu,Mem Start=" + fromDate + " End=" + toDate + " user=" + sunetid;
  return userUtilizationCommand;
  }else{
    return "Error, please confirm input"
  }
}

        function generateTips() {
          var sunetid = $('#sunetid').val();
          var jobid = $('#jobid').val();
          var slurmStatus = $('#slurmStatus');
          var slurmGpuUtil = $('#slurmGpuUtil');
          var slurmHistory = $('#slurmHistory');
          var slurmCancel = $('#slurmCancel');
          if (sunetid) {
            console.log("has sunet");
            slurmStatus.empty();
            var statusCommand = "squeue -u " + sunetid;
            slurmStatus.val(statusCommand);
            userUtilizationCommand=generateUserUtilization(sunetid);
            slurmHistory.empty();
            slurmHistory.val(userUtilizationCommand);

          }
          if (jobid) {
            console.log("has jobid");
            slurmGpuUtil.empty();
            var slurmGpuUtilCommand = "srun --jobid=" + jobid + " --pty bash nvidia-smi";
            slurmGpuUtil.val(slurmGpuUtilCommand);
            var slurmCancelCommand = "scancel " + jobid;
            slurmCancel.empty().val(slurmCancelCommand);
          }

        }

        //gets data-target attribute of button and copies contents of that element
        function copyButton(event) {
          console.log('event', event);
          var node = event.target;
          if (hasClass(node, 'fa-clipboard')) { //grabbed icon instead of button
            node = node.closest('.btn.copy');
          }
          console.log('computed node', node);
          console.log('target', node.dataset.target);
          var targetText = node.dataset.target;
          var textToCopy = $("#" + targetText);
          var text = textToCopy.val();
          console.log('textToCopy', textToCopy);
          copyTextToClipboard(text);
        }

var dateFormat = "yy-mm-dd",
      from = $( "#from" )
        .datepicker({
          defaultDate: "-1w",
          dateFormat: dateFormat,
          changeMonth: true,
          changeYear: true,
          numberOfMonths: 3,
          minDate: "-3Y", 
          maxDate: "+1D"
        })
        .on( "change", function() {
          to.datepicker( "option", "minDate", getDate( this ) );
        }),
      to = $( "#to" ).datepicker({
          defaultDate: "-1w",
          changeMonth: true,
          changeYear: true,
          numberOfMonths: 1,
          dateFormat: dateFormat,
          minDate: "-3Y", 
          maxDate: "+1D"
      })
      .on( "change", function() {
        from.datepicker( "option", "maxDate", getDate( this ) );
      });
   to.datepicker("setDate", "+0d");
  from.datepicker("setDate", "-7d");
    function getDate( element ) {
      var date;
      try {
        date = $.datepicker.parseDate( dateFormat, element.value );
      } catch( error ) {
        date = null;
      }
      return date;
    }

      });