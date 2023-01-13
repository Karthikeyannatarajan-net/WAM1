/* ***WorkflowManager***
 * Currently only written against Service-Now
 * Needs modification for WorkflowPeg to be useable accordingly
*/

if (typeof gel !== 'function') { window.gel = function (sInput) { return document.getElementById(sInput); }; }
/*Constants*/

var cnt = 0;
var sAutoVer = "601-UC"; //Not expected to actually run queries correctly yet - See Line 2521
var sNTTAPIURL = OutSysEnv + "/DWSUtilitiesHubAPI/";
var sImagePath = OutSysEnv + "/DWSUtilitiesScript/img/DWSUtilitiesScript.";
var sNTTScriptPath = OutSysEnv + "/DWSUtilitiesScript/";
var sINCQuery = "Incident,INC-REQ,Remote Resolution,Site Lead - INC";
var sREQQuery = "Scheduler";
var sREQGenQuery = "INC-REQ,Request";
var sStagingQuery = "Staging";
var AssignmentGroupDescriptionOverride = true;
var WFLogDBID = "";
var sFrame = ReturnFrame();
var MainWin = FindMainWin();
var sHostname = window.location.hostname;
var sDevEmail = "jonathan.lee@nttdata.com";
/*Constants conditionally set one time at start of script*/
if (sAccount === null) { var sAccount = ""; }
var sJQUIURL = "";
var sJQUICSSURL = "";
var sLoadTrack = "";
/*Dynamic vars, clearing each cycle*/
var sRoleQueryPart = "";
var sQueueURL = ""; //Current URL
var sOrigQueueURL = ""; //URL of Queue when AD is loaded
var dCurDate = null;
var dPreErrDate = null;
var dErrDate = null;
var dLastWFUpdate = null;
var AssignedTo = null;
var btnUpdate = null;
var sHH = "";
var sMS = "";
var sDD = "";
var sYY = "";
var sMM = "";
var sZone = "";
var sActionDTStamp = "";
var sCodeStamp = "";
var arrTicketLog = [[]];
var sNumber = "";
var sPriority = "";
var sFirstName = "";
var sAssGroup = "";
var sAssignedTo = "";
var sAssignedToEmail = "";
var sSNGroupID = "";
var sCreatedOn = "";
var sOpened = "";
var sLoadTime = "";
var sUserFullName = "";
var sProcessLog = "";
var sUpdateNotes = "";
var sShortDesc = "";
var sDescField = "";
var sTicketLog = "";
var sLocation = "";
var sGroupOverrideSearch = "";
var sUpdatedFieldList = "";
var nUpdateFound = 0;
var nCheckTableErrCount = 0;
var nGetTicketRun = 0;
var nCountTicketRun = 0;
var nErrCount = 0;
var nCurLoopCheck = 0;
var bReloadQueue = false;
var bBombReturn = false;
var bAssGroupChange = false;
var oStuckCount = {};
var sMedstarWorkNote = "";
var arrCheckAssignment = [];
var sQueryCaller = "";
var dSNLoadTime;
var LoggedinUsername=""
var MailWFUpdate = new Date();
var sToolLogInfo = "";
/*JSON Return Objects*/
var TechnicianAssignmentByAccountJSON = "";
var RoleMatchMatrixByAccountJSON = "";
var GroupMatchMatrixByAccountJSON = "";

/*US Bank vars*/
var sUserEmail = "";
var arrEmailAdds = [];

var isTicketingToolEnv = false;

// BG - Check if the environment is Ticketing tools.
if (sHostname.search("service-now") > -1) { isTicketingToolEnv = true; }

//if (sHostname.search("aig") > -1) sAccount = "AIG";
if (sHostname.search("amgen") > -1) sAccount = "AMGEN";
if (sHostname.search("ascension") > -1) sAccount = "AMITA";
if (sHostname.search("bombardier") > -1) sAccount = "Bombardier";
if (sHostname.search("citigroup") > -1) sAccount = "Banamex";
if (sHostname.search("csmc") > -1) sAccount = "Cedars-Sinai";
if (sHostname.search("corteva") > -1) sAccount = "Corteva";
if (sHostname.search("grupobimbo") > -1) sAccount = "Grupo Bimbo";
if (sHostname.search("guardian") > -1) sAccount = "Guardian";
if (sHostname.search("magellan") > -1) sAccount = "Magellan";
if (sHostname.search("novelis") > -1) sAccount = "Novelis";
if (sHostname.search("suncoke") > -1) sAccount = "SunCoke Energy";
if (sHostname.search("tenet") > -1) sAccount = "Tenet";
if (sHostname.search("tollbrothers") > -1) { sAccount = "Tollbrothers"; }
if (sHostname.search("pegasus") > -1) sAccount = "Vanderbilt";
if (sHostname.search("healthbc") > -1) sAccount = "WEST";
if (sHostname.search("txdot") > -1) sAccount = "TxDOT - NOW";
if (sHostname.search("itsmnow") > -1) { sAccount = "US Bank"; }
if (sHostname.search("Worley") > -1) { sAccount = "Worley"; }

if (sHostname.search("nttds") > -1) {
  oSelDom = document.getElementsByClassName("navpage-pickers navpage-header-content hidden-xs hidden-sm hidden-md").item(0).innerText.trim();
  if (oSelDom == "Fifth Third Bank") sAccount = "Fifth Third Bank";
  if (oSelDom == "Independent Health") sAccount = "Independent Health";
  if (oSelDom == "MedStar Health") sAccount = "MedStar";
}

/*Detect which jQuery-UI to use based on jQuery version
if (jQuery.fn.jquery.split('.')[0] > 1 || jQuery.fn.jquery.split('.')[1] > 6) {
  sJQUIURL = sNTTScriptPath + "jquery-ui.min1121.js";
  sJQUICSSURL = sNTTScriptPath + "jquery-ui.css";
} else {
  sJQUIURL = sNTTScriptPath + "jquery-ui.min184.js";
  sJQUICSSURL = sNTTScriptPath + "jquery-ui.css";}
*/


var elFirstScript = document.getElementsByTagName("script")[0];
var elJQScript;
if (typeof jQuery == "undefined") {
    elJQScript = document.createElement("script");
    elJQScript.src = sNTTScriptPath + "scripts/DWSUtilitiesScript.jquery3_1_1_min.js" ;
    elFirstScript.parentNode.insertBefore(elJQScript, elFirstScript);
}


/*This is for Us Bank Accept Ticket button*/
function AcceptTicket() {
  var btnUpdate = MainWin.document.getElementById("accept");

  if (btnUpdate) {
    MainWin.document.getElementById("accept").click();
    setTimeout("", 5000);
    AppendRunLog("Accept button Found; clicking it.");
  }
  AppendRunLog("Accept button not Found");
}

function AppendToolLog(sInput) {
  var sLogDate = new Date().toString();
  sToolLogInfo += sLogDate + sInput + "\n";
}


function AppendRunLog(sInput) {
  var oLogText = gel("txtLog");
  var sLogDate = new Date().toString();

  if (!oLogText) {
    console.log("[" + sLogDate + "] " + sInput);
    return;
  }

  oLogText.readOnly = false;
  oLogText.innerHTML = oLogText.innerHTML + "[" + sLogDate + "] " + sInput + "\n";
  oLogText.scrollTop = oLogText.scrollHeight;
  oLogText.readOnly = true;
}

function AssignToOpener() {
  var grTask = null;
  var grUser = null;
  var sAssHex = "";

  AppendRunLog("Assigning to opener.");
  grTask = new MainWin.GlideRecord("sc_task");
  grTask.get(MainWin.g_form.getUniqueValue());
  grUser = new MainWin.GlideRecord("sys_user");
  grUser.query();
  while (gr.next()) {
    sAssHex = gr.sys_id;
  }
  UpdateWorkflowLog();
}


function beginADWinDrag(DragElem, MouseDownEvent) {
  var deltaX = MouseDownEvent.clientX - parseInt(DragElem.style.left);
  var deltaY = MouseDownEvent.clientY - parseInt(DragElem.style.top);

  if (document.addEventListener) {
    document.addEventListener("mousemove", MouseMoveOverride, true);
    document.addEventListener("mouseup", MouseUpOverride, true);
  }
  else if (document.attachEvent) {
    /*Support for IE8 and below*/
    document.attachEvent("onmousemove", MouseMoveOverride);
    document.attachEvent("onmouseup", MouseUpOverride);
  } else {
    var origOnMouseMove = document.onmousemove;
    var origOnMouseUp = document.onmouseup;
    document.onmousemove = MouseMoveOverride;
    document.onmouseup = MouseUpOverride;
  }

  if (MouseDownEvent.stopPropagation) {
    MouseDownEvent.stopPropagation();
  } else {
    MouseDownEvent.cancelBubble = true;
  }

  if (MouseDownEvent.preventDefault) {
    MouseDownEvent.preventDefault();
  } else {
    MouseDownEvent.returnValue = false;
  }

  function MouseMoveOverride(e) {
    if (!e) e = window.event;
    DragElem.getElementsByClassName("SNAPWinTitle")[0].style.cursor = "grabbing";
    DragElem.style.left = (e.clientX - deltaX) + "px";
    DragElem.style.top = (e.clientY - deltaY) + "px";
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  }

  function MouseUpOverride(e) {
    if (!e) e = window.event;
    DragElem.getElementsByClassName("SNAPWinTitle")[0].style.cursor = "grab";
    if (document.removeEventListener) {
      document.removeEventListener("mouseup", MouseUpOverride, true);
      document.removeEventListener("mousemove", MouseMoveOverride, true);
    }
    else if (document.detachEvent) {
      document.detachEvent("onmouseup", MouseUpOverride);
      document.detachEvent("onmousemove", MouseMoveOverride);
    }
    else {
      document.onmouseup = origOnMouseUp;
      document.onmousemove = origOnMouseMove;
    }
    /*Save Pop Window position when it is done being dragged*/
    if (DragElem.id == "DispatchWindow") {
      localStorage.setItem("sADWinLeft", DragElem.style.left);
      localStorage.setItem("sADWinTop", DragElem.style.top);
    }
    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  }
}

function CheckTable() {
  var elTicketBody;
  var arrRows;
  var nID;
  var sErrMsg = "";
  var MS_IN_SECOND = 1000;
  var SECONDS_IN_MINUTE = 60;
  var RELOAD_SECONDS = 9; //Number of seconds that should elapse before this routine calls itself again with SetTimeout
  var NONLOAD_MS = 250;
  var RELOAD_MS = RELOAD_SECONDS * MS_IN_SECOND; //RELOAD_SECONDS converted to milliseconds
  var STUCK_WAIT_MINUTES = 5;
  var STUCK_WAIT_SECONDS = STUCK_WAIT_MINUTES * SECONDS_IN_MINUTE;
  var STUCK_WAIT_MS = STUCK_WAIT_SECONDS * MS_IN_SECOND;
  var STUCK_FIVE_MINUTE_MARK = parseInt((STUCK_WAIT_MS / NONLOAD_MS) / 3) //Stuck counter is incremented every *third* time update button is found (0,1,2)
  var CHECKS_PER_SECOND = MS_IN_SECOND / NONLOAD_MS;
  var ERROR_RELOAD_TRIGGER = CHECKS_PER_SECOND * RELOAD_SECONDS; //Number of error counts encountered that should trigger a page reload
  var ERROR_NOTIFICATION_TRIGGER = CHECKS_PER_SECOND * 300; //Number of error counts that should trigger an error notification (300 seconds in 5 minutes)
  var WFUPDATE_INTERVAL_MS = 1800000; //30 minutes
  var dNow = new Date();
  //var sCurGroup = "";
  //var sCurNumber = "";
  var MAIL_INTERVAL_MS = 1800000; //30 minutes
  var MaildNow = new Date();
  
  if (sAccount == "AIG") {
    RELOAD_SECONDS = 9;
    RELOAD_MS = RELOAD_SECONDS * 1000;
    ERROR_RELOAD_TRIGGER = CHECKS_PER_SECOND * RELOAD_SECONDS;
  }

  if (!gel("chkRun").checked) return;

  AppendRunLog("CheckTable()");

  localStorage.setItem("sADLogUpdate", "CheckTable() - " + dNow.toString());

  try {

    AppendRunLog("Checking WAM BOT Status");
  
    if (MaildNow.getTime() > (MailWFUpdate.getTime() + MAIL_INTERVAL_MS)) {
        // EmailNotification("WAM BOT is Running - "+ MaildNow.toString(),"WAM BOT");
         AppendRunLog("Mail Trigged WAM BOT Status");
         MailWFUpdate=MaildNow;
        }


    if(gel("request_status_message").innerText.indexOf("Running") > -1) {
      AppendRunLog("A transaction appears to be running. Non-load re-check...");
      setTimeout(CheckTable, NONLOAD_MS);
      return;
    }
  } catch(err) {
    AppendRunLog(err);
  }
  
  if (dLastWFUpdate && dNow.getDay() > 0 && dNow.getDay() < 6 && dNow.getHours() > 3 && dNow.getHours() < 21) {
    if (dNow.getTime() > dLastWFUpdate.getTime() + WFUPDATE_INTERVAL_MS) {
      TriggerErrorNotification("It has been longer than 30 minutes since the last time the Workflow Log was updated by WAM.");
    }
  }

  try {
    sQueueURL = MainWin.location.href;
    AppendRunLog("sQueueURL:" + sQueueURL);
  } catch (err) {
    sErrMsg = "Error getting frame page location. Page may be displaying error or other cross-domain condition.";
    AppendRunLog(sErrMsg);
    if (nCheckTableErrCount > ERROR_RELOAD_TRIGGER) {
      MainWin.location.reload();
    }
    if (nCheckTableErrCount > ERROR_NOTIFICATION_TRIGGER) {
      TriggerErrorNotification(sErrMsg);
      nCheckTableErrCount = 0;
    }
    nCheckTableErrCount++;
    AppendRunLog("NONLOAD_MS:" + String(NONLOAD_MS));
    setTimeout(CheckTable, NONLOAD_MS);
    return;
  }

  if (sAccount == "Vanderbilt") {
    CheckTablePeg(); //Under construction
    return;
  }

  btnUpdate = MainWin.document.getElementById("sysverb_update");
  if(!btnUpdate) btnUpdate = MainWin.document.getElementById("sysverb_update_and_stay");
  elTicketBody = MainWin.document.getElementsByTagName("tbody");

  if (btnUpdate) {
    if (nUpdateFound > 1) {
      nUpdateFound = 0;
      oStuckCount[sQueueURL] = oStuckCount[sQueueURL] || 0;
      oStuckCount[sQueueURL]++;
      if (oStuckCount[sQueueURL] == 1) {
        /*This is probably not necessary*/
        //sCurNumber = MainWin.g_form.getValue("number");
        //sCurGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
        //if(sNumber == sCurNumber && sAssGroup != sCurGroup) {
        //  AppendRunLog("Assignment group mismatch on same ticket. Simultaneous update condition may exist. Attempting queue reload.");
        //  MainWin.location.href = sOrigQueueURL;
        //}
        AppendRunLog("Found update button too many times; clicking it.");
        btnUpdate.click();
      } else {
        AppendRunLog("Attempting queue reload.");
        MainWin.location.href = sOrigQueueURL;
      }
      if (oStuckCount[sQueueURL] > STUCK_FIVE_MINUTE_MARK) {
        oStuckCount[sQueueURL] = 0;
        TriggerErrorNotification("Script appears to have been stuck on the same page for over 5 minutes." + TicketSNErrors());
      }
    } else {
      AppendRunLog("Found update button. Exiting CheckTable()");
      AppendRunLog("Main Window: " + MainWin.toString());
      nUpdateFound++;
    }
    /*Still on ticket so cancel*/
    AppendRunLog("NONLOAD_MS:" + String(NONLOAD_MS));
    setTimeout(CheckTable, NONLOAD_MS);
    return;
  }

  if (bReloadQueue) {
    AppendRunLog("Initial queue reload called.");
    MainWin.location.href = sOrigQueueURL;
    AppendRunLog("RELOAD_MS:" + String(RELOAD_MS));
    setTimeout(CheckTable, RELOAD_MS);
    bReloadQueue = false;
    return;
  }

  nCheckTableErrCount = 0;
  nUpdateFound = 0;
  oStuckCount = {};

  if (elTicketBody.length > 0) {
    for (var i = 0; i < elTicketBody.length; i++) {
      if (elTicketBody[i].className.substr(0, 4) == "list" && elTicketBody[i].className.substr(-4, 4) == "body") nID = i;
    }
    if (elTicketBody[nID]) {
      arrRows = elTicketBody[nID].getElementsByTagName("tr");
    } else {
      AppendRunLog("Problem enumerating rows. Reloading page, recalling setTimeOut on CheckTable, and returning early.");
      MainWin.location.reload();
      AppendRunLog("RELOAD_MS:" + String(RELOAD_MS));
      setTimeout(CheckTable, RELOAD_MS);
      return;
    }
    if (arrRows.length > 0) {
      if (arrRows[0].className.includes("no") && arrRows[0].className.includes("records")) {
        AppendRunLog("# of Tickets Found: 0");
        elTicketBody[0].parentNode.removeChild(elTicketBody[0]);
        MainWin.location.reload();
      } else {

        sToolLogInfo="";
        AppendRunLog("# of Tickets Found: " + String(arrRows.length));
        AppendRunLog("Checking first ticket...");

        AppendToolLog("# of Tickets Found: " + String(arrRows.length));
        AppendToolLog("Checking first ticket...");

        //Need to keep from renavigating to older tickets
        //if(arrRows[0].getElementsByTagName("td")[2].getElementsByTagName("a")[0].innerHTML == sNumber){
        arrRows[0].getElementsByTagName("td")[2].getElementsByTagName("a")[0].click();
        MainWin.alert = function (sInput) { MainWin.g_form.addInfoMessage(sInput); };
        window.alert = function () { return false; };
        AppendRunLog("Overriding MainWin.alert");
        AppendRunLog("Proceeding to CheckTicket and returning, without re-firing.");
        AppendRunLog("RELOAD_MS:" + String(RELOAD_MS));
        nGetTicketRun = 0;
        nCountTicketRun = 0;
        setTimeout(CheckTicket, RELOAD_MS);
        return;
      }
    } else {
      AppendRunLog("# of Tickets Found: 0");
      elTicketBody[0].parentNode.removeChild(elTicketBody[0]);
      MainWin.location.reload();
    }
    nCheckTableErrCount = 0;
  } else {
    sErrMsg = "Error finding tbody element. Script may be stuck on a non-queue page.";
    AppendRunLog(sErrMsg);
    bReloadQueue = true;
    if (nCheckTableErrCount > ERROR_NOTIFICATION_TRIGGER) {
      TriggerErrorNotification(sErrMsg);
      nCheckTableErrCount = 0;
    }
    nCheckTableErrCount++;
  }

  /*Restart process to check again*/
  AppendRunLog("RELOAD_MS:" + String(RELOAD_MS));
  setTimeout(CheckTable, RELOAD_MS);
}


function CheckTablePeg() {
  var elIncidentPanel = MainWin.document.getElementsByClassName("panel-incident")[0];
  var elTaskPanel = MainWin.document.getElementsByClassName("panel-task")[0];
  var arrIncRows = [];
  var arrTaskRows = [];
  var arrIncCells = [];
  var arrTaskCells = [];
  var sTicketURL = "";
  var NONLOAD_MS = 250;
  var RELOAD_MS = 30000;
  var sCurTicketNo = "";
  var bProcFlag = false;
  var bUnassigned = false;
  var nRow = -1;

  if (elIncidentPanel) {
    arrIncRows = elIncidentPanel.getElementsByTagName("tr");
  }
  if (elTaskPanel) {
    arrTaskRows = elTaskPanel.getElementsByTagName("tr");
  }

  if (bReloadQueue) {
    AppendRunLog("Initial queue reload called (Peg).");
    MainWin.location.href = sOrigQueueURL;
    AppendRunLog("RELOAD_MS:" + String(RELOAD_MS));
    setTimeout(CheckTable, RELOAD_MS);
    bReloadQueue = false;
    return;
  }

  if (!elIncidentPanel && !elTaskPanel) {
    AppendRunLog("No ticket panels found. Rechecking in " + String(RELOAD_MS) + "ms.");
    setTimeout(CheckTable, RELOAD_MS);
    return;
  }

  btnUpdate = MainWin.document.getElementById("ctl00_ContentPlaceHolder1_butUpdate");

  if (btnUpdate) {
    /*Still on ticket so cancel*/
    AppendRunLog("NONLOAD_MS:" + String(NONLOAD_MS));
    setTimeout(CheckTable, NONLOAD_MS);
    return;
  }

  if (arrIncRows.length > 0) {
    for (var i = 1; i < arrIncRows.length; i++) {
      arrIncCells = arrIncRows[i].getElementsByTagName("td");

      for (var j = 0; j < arrTicketLog[j].length; j++) {
        sCurTicketNo = arrIncCells[1].getElementsByTagName("a")[0].innerHTML;
        if (sCurTicketNo == arrTicketLog[j]) {
          bProcFlag = true;
        }
      }

      if (arrIncCells[9].innerHTML == "") {
        bUnassigned = true;
      }

      if (!bProcFlag && bUnassigned && nRow == -1) {
        nRow = i;
      }
    }

    if (nRow == -1) {
      AppendRunLog("No unassigned incidents found. Reloading...");
      setTimeout(CheckTable, RELOAD_MS);
      MainWin.location.reload();
    } else {
      sTicketURL = arrIncCells[1].getElementsByTagName("a")[0].href //<-- Navigate to this to check the ticket

      AppendRunLog("Navigating to first ticket.");
      MainWin.location.href = sTicketURL;

      AppendRunLog("Proceeding to CheckTicket and returning, without re-firing.");
      AppendRunLog("RELOAD_MS:" + String(RELOAD_MS));
      setTimeout(CheckTicket, RELOAD_MS);
    }
  } else {
    AppendRunLog("No incidents found. Reloading...");
    setTimeout(CheckTable, RELOAD_MS);
    MainWin.location.reload();
  }
}

function sleep(milliseconds) {
  var date = Date.now();
  var currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}


function GetTechAssignmentArray() {
  AppendRunLog("Getting Tech Assignment array");
  if (!MainWin.g_form) return true;
  var sGroupID = MainWin.g_form.getValue("assignment_group");
  var grGroupAssignment = new MainWin.GlideRecord("sys_user_grmember");

  grGroupAssignment.addQuery("group", sGroupID);
  //grGroupAssignment.addQuery("user", TechName);
  grGroupAssignment.query()
  while (grGroupAssignment.next()) {
    console.log(grGroupAssignment.user);
    arrCheckAssignment.push(grGroupAssignment.user);
  }
  AppendRunLog("Tech Assignment array finished");
}


function CheckTechs() {
  var sCurGroup = "";
  var sCurGroupName = "";
  var sDescription = "";
  var bFound = false;

  //Modified by sanjay on 10-Jun-2022 - Start
   if (isTicketingToolEnv) {
    sCurGroupName = MainWin.g_form.getDisplayBox("assignment_group").value;
    sDescription = MainWin.g_form.getValue("description");;
  }
  else {
    sCurGroupName = "SN-NTT_FS_Depot";
    sDescription = "";
  }
  //Modified by sanjay on 10-Jun-2022 - End

  sUpdateNotes = "Updated by Workflow Manager - v" + sAutoVer + "\n\n";

  if (sAccount == "AIG" || sAccount == "Tenet" || sAccount == "WEST") {
    sCurGroup = MainWin.g_form.getValue("assignment_group");
    if (sSNGroupID != "" && sSNGroupID != sCurGroup) {
      if (sAccount != "Tenet" || sCurGroupName != "FieldSppt-Cloud Techs" || sDescription.indexOf(" RSGN ") > -1) {
        MainWin.g_form.setValue("assignment_group", sSNGroupID);
        MainWin.g_form.flash("assignment_group", "#00C00", 0); //Flash
      }
      if (sAccount == "WEST") {
        MainWin.g_form.setValue("u_transfer_code", "3");
        MainWin.g_form.flash("u_transfer_code", "#00C00", 0); //Flash
        MainWin.g_form.setValue("u_transfer_reason", "Dispatching Field Services");
        MainWin.g_form.flash("u_transfer_reason", "#00C00", 0); //Flash 
      }
      SaveAndReturn();
      return;
    }
  }

  if (sAccount == "Vanderbilt") {
    ProcessAssignment();
    return;
  }

 // if (sAccount == "Worley") {
 //ProcessAssignment();
 //  return;
//}
AppendRunLog("Technician length:" + String(TechnicianAssignmentByAccountJSON.length));

AppendToolLog("Technician length:" + String(TechnicianAssignmentByAccountJSON.length));

  for (i = TechnicianAssignmentByAccountJSON.length - 1; i >= 0; i--) {
    //Revised group match matrix OPPM availability check here
    if (!TechnicianAssignmentByAccountJSON[i]['Availability']) {
      TechnicianAssignmentByAccountJSON.splice(i, 1);
      AppendRunLog("Tech[" + String(i) + "] is Inactive. Removing from array.");
    }
  }

  if (typeof(TechnicianAssignmentByAccountJSON) == 'undefined') {
    TechnicianAssignmentByAccountJSON = "";
  }

  for (i = TechnicianAssignmentByAccountJSON.length - 1; i >= 0; i--) {
    for (i2 = arrCheckAssignment.length - 1; i2 >= 0; i2--) {

      if (arrCheckAssignment[i2] == TechnicianAssignmentByAccountJSON[i]['Sys_ID']) {
        bFound = true;
      }
    }
    if (!bFound) {
      TechnicianAssignmentByAccountJSON.splice(i, 1);
      AppendRunLog("Tech[" + String(i) + "] is not Part of the Assignment group. Removing from array.");

    }
    bFound = false;
  }

  switch (TechnicianAssignmentByAccountJSON.length) {
    case 0:
      AppendRunLog("No technicians found for the given assignment group. Assigning to self...");
      AppendToolLog("No technicians found for the given assignment group. Assigning to self...");
      sUpdateNotes += "No techs found self-assign fallback.";
      sPriority = "[Unknown]";
      NoteMisroute();
      DoSelfAssign();
      break;
    case 1:
      AppendRunLog("Solitary group member found for the defined role query: " + sRoleQueryPart + "\n Skipping straight to assign.");
      AppendToolLog("Solitary group member found for the defined role query: " + sRoleQueryPart + "\n Skipping straight to assign.");
      sUpdateNotes += "Only one group member found for role query.";
      LogAssign();
      break;
    default:
      ProcessAssignment();
      break;
  }
}


function CheckTicket() {  // BG - This Method shouldn't executed if this is not a Ticketing window.
  var sCurNumber = "";
  var grTicket;
  var grAssGroup;
  var oAssOptions; //Pegasus
  var elPriority; //Pegasus
  var grUser; //Tenet
  var oServiceLocation; //Tenet
  var grRITM; //Tenet & US Bank
  var grCatItem; //US Bank
  var sHA = ""; //WEST
  var sCI = ""; //WEST
  var sCurASG = "";//WEST & Tenet
  var sService = "";

  var arrLocationNovelisStrings = ["User Location",
    "Location", "Location where contractor will be working",
    "From", "To", "Where do you want your item delivered?",
    "Where do you want your new desktop delivered?",
    "Where do you want your new laptop delivered?",
    "Provide site where most of the users are located",
    "Physical location the Contractor will sit/perform duties (If remote, select Novelis Manager's site)",
    "Site", "Move to Location", "What is your location?", "Server Location", "Primary Location"];

  GetTechAssignmentArray();

  //BG added to by pass the Service now environment.

  if (isTicketingToolEnv) {
    if (!gel("chkRun").checked) return;

    localStorage.setItem("sADLogUpdate", "CheckTicket() - " + new Date().toString());

    btnUpdate = MainWin.document.getElementById("sysverb_update");

    if (btnUpdate && MainWin.g_form && MainWin.g_user) {
      dCurDate = new Date();
      ShowLoader();
      AppendRunLog("Update button, GlideForm, and GlideUser found. Starting ticket update process...");

      sShortDesc = MainWin.g_form.getValue(sDescField);

      grAssGroup = MainWin.g_form.getReference("assignment_group");
      sCurNumber = MainWin.g_form.getValue("number");

      if (sAccount == "AMITA") {
        sAssGroup = grAssGroup.u_full_name;
      } else {
        sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
      }

      grTicket = new MainWin.GlideRecord("task");
      grTicket.get(MainWin.g_form.getUniqueValue());
      sCreatedOn = grTicket.sys_created_on;
      sUserFullName = MainWin.g_user.fullName;

      if (sNumber == sCurNumber) {
        TriggerErrorNotification("Prior ticket matches current ticket. Queue filter may need to be adjusted.");
      }

      sNumber = sCurNumber;

      switch (sAccount) {
        case "AIG":
          if (sNumber.substr(0, 3) == "INC") {
            sGroupOverrideSearch = MainWin.g_form.getValue("location");
            sRoleQueryPart = sINCQuery;
          }
          if (sNumber.substr(0, 3) == "SCT") {
            if (MainWin.g_form.getValue("sc_task.request_item.cat_item") == "Computer Hardware and Accessories: Standard Request") {
              sGroupOverrideSearch = MainWin.gel(FindVariableID4Text("Select the location where items are to be deployed"));
              sRoleQueryPart = sREQGenQuery;
            } else {
              sGroupOverrideSearch = MainWin.g_form.getValue("location");
              sRoleQueryPart = sREQGenQuery;
            }
          }
          break;
        case "AMITA":
          UpdateBlankPriorityFields();
          if (sNumber.substr(0, 3) == "INC") {
            sPriority = MainWin.g_form.getValue("priority");
            if (parseInt(sPriority) < 3) {
              AppendRunLog("High priority ticket. Assigning to self...");
              sUpdateNotes += "Updated by Workflow Manager - v" + sAutoVer + "\n\nHigh priority ticket self-assign.";
              GenerateCodeStamp("WARM");
              DoSelfAssign();
              return;
            }
            sRoleQueryPart = sINCQuery;
          } else {
            sPriority = MainWin.g_form.getReference("request_item").u_sla_type;
            if (sPriority == "1") {
              AppendRunLog("High priority ticket. Assigning to self...");
              sUpdateNotes += "Updated by Workflow Manager - v" + sAutoVer + "\n\nHigh priority ticket self-assign.";
              GenerateCodeStamp("WARM");
              DoSelfAssign();
              return;
            }
            if (sPriority == "SmartHands") {
              sRoleQueryPart = sINCQuery;
            } else {
              sRoleQueryPart = sREQQuery;
            }
          }
          break;
        case "Banamex": //Added 4/26/2021 -  Adam Holland
          switch (sNumber.substr(0, 3)) {
            case "INC": sRoleQueryPart = sINCQuery; break;
            case "TAS": sRoleQueryPart = sREQGenQuery; break;
            case "REQ": sRoleQueryPart = sREQGenQuery; break;
          }
          sGroupOverrideSearch = MainWin.g_form.getValue("location");
          break;
        case "Bombardier":
          //Need to check assignment by appending assignment group with "Office Location" for Incidents and special field for TASK tickets
          if (sShortDesc.substr(0, 5) != "BOTA:") {
            AppendRunLog("BOTA missing from short description. This may not be a vetted ticket. Stopping early.");
            gel("chkRun").click();
            return;
          }
          switch (sNumber.substr(0, 3)) {
            case "INC": sRoleQueryPart = sINCQuery; break;
            case "INT": sRoleQueryPart = sStagingQuery; break;
            default:
              if (sShortDesc.indexOf("-- Assessment") > -1 || sShortDesc.indexOf("-- Receive") > -1) {
                sRoleQueryPart = sStagingQuery;
              } else {
                sRoleQueryPart = sREQGenQuery;
              }
          }
          break;
        case "Caterpillar":
          if (sNumber.substr(0, 3) == "INC") {
            sRoleQueryPart = sINCQuery;
          } else {
            if (String(MainWin.g_form.getValue("short_description")).indexOf("IMAC Staging") > -1) {
              sRoleQueryPart = sStagingQuery;
            } else {
              if (String(MainWin.g_form.getValue("short_description")).indexOf("CIPPPS") > -1) {
                sRoleQueryPart = sINCQuery;
              } else {
                sRoleQueryPart = sREQQuery;
              }
            }
          }
          break;
        case "Cedars-Sinai":
          if (sShortDesc.substr(0, 4) != "WFA-") return;
          switch (sNumber.substr(0, 3)) {
            case "INC": sRoleQueryPart = sINCQuery; break;
            case "INT": sRoleQueryPart = sStagingQuery; break;
            default: sRoleQueryPart = sREQGenQuery;
          }
          if (sShortDesc == "Generate Quote") {
            MainWin.g_form.setValue("assigned_to", "ee39ad5a4fb30e003f744b5e0210c771"); //Silvia Gonzalez
            MainWin.g_form.flash("assigned_to", "#00C00", 0); //Flash
            LogAssign();
            return;
          }
          break;
        case "Fifth Third Bank":
          switch (sNumber.substr(0, 3)) {
            case "INC": sRoleQueryPart = sINCQuery; break;
            case "SCT": sRoleQueryPart = sREQGenQuery; break;
            case "TAS": sRoleQueryPart = sREQGenQuery; break;
          }
          if (sShortDesc.substr(0, 28) == "New/Upgrade Hardware Request" && (sShortDesc.substr(-17) == "Discovery / Build" || sShortDesc.substr(-5) == "Build")) {
            ProcessFTBQuery();
            return;
          }
          break;
        case "Grupo Bimbo":
          switch (sNumber.substr(0, 3)) {
            case "INC": sRoleQueryPart = sINCQuery; break;
            case "TAS": sRoleQueryPart = sREQGenQuery; break;
          }
          break;
        case "Guardian":
          if (sNumber.substr(0, 3) == "TAS" && sShortDesc == "Retrieve equipment") AssignToOpener();
          switch (sNumber.substr(0, 3)) {
            case "INC": sRoleQueryPart = sINCQuery; break;
            case "TAS": sRoleQueryPart = sREQGenQuery; break;
          }
          break;

        case "Independent Health":
          if (sNumber.substr(0, 3) == "INC") {
            sRoleQueryPart = sINCQuery;
          } else {
            if (sShortDesc == "Software Task") {
              /*Assign to IHA-Service Desk*/
              MainWin.g_form.setValue("assignment_group", "43d7a4cf37b0438059b79b7a93990ec2");
              MainWin.g_form.flash("assignment_group", "#00C00", 0); //Flash
              UpdateWorkflowLog();
              return;
            } else {
              sRoleQueryPart = sREQGenQuery;
            }
          }
          break;
        case "MedStar":
          switch (sNumber.substr(0, 3)) {
            case "INC":
              sRoleQueryPart = sINCQuery;
              sGroupOverrideSearch = MainWin.g_form.getValue("location");
              break;
            case "TAS":
              sRoleQueryPart = sREQGenQuery;
              oServiceLocation = MainWin.gel(FindVariableID4Text("Location of Service"));
              if (oServiceLocation) sGroupOverrideSearch = oServiceLocation.value;
              if (!oServiceLocation) oServiceLocation = sGroupOverrideSearch = MainWin.g_form.getValue("location");
              if (!oServiceLocation) {
                grUser = MainWin.g_form.getReference("request.requested_for");
                sGroupOverrideSearch = grUser.location;
                if (sGroupOverrideSearch == "Vendor" || sGroupOverrideSearch == "Location not provided") {
                  sGroupOverrideSearch = "";
                }
              }
              break;
          }
          break;
        case "Novelis":
          switch (sNumber.substr(0, 3)) {
            case "INC":
              AppendRunLog("TAS");
              sRoleQueryPart = sINCQuery;
              sGroupOverrideSearch = MainWin.g_form.getValue("location");

              break;
            case "TAS":
              AppendRunLog("TAS");
              sRoleQueryPart = sREQGenQuery;
              oServiceLocation = MainWin.gel(FindVariableID4Text("Location"));
              AppendRunLog("First Location block - " + sGroupOverrideSearch);
              if (!oServiceLocation) oServiceLocation = MainWin.g_form.getValue("location");

              //added 4/7/2021
              for (var i = 0; i < arrLocationNovelisStrings.length; i++) {
                if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text(arrLocationNovelisStrings[i]));
              }
              AppendRunLog("Second Location block - " + sGroupOverrideSearch);
              if (!oServiceLocation) {
                grUser = MainWin.g_form.getReference("request_item.request.requested_for");
                sGroupOverrideSearch = grUser.location;
                AppendRunLog("Third Location block - " + sGroupOverrideSearch);
                if (sGroupOverrideSearch == "Vendor" || sGroupOverrideSearch == "Location not provided") {
                  sGroupOverrideSearch = "";
                  AppendRunLog("Last Location block - " + sGroupOverrideSearch);
                }
              }
              break;
          }
          break;
        case "SunCoke Energy":
          switch (sNumber.substr(0, 3)) {
            case "INC": sRoleQueryPart = sINCQuery; break;
            case "SCT": sRoleQueryPart = sREQGenQuery; break;
          }
        case "Tenet":
          if (sNumber.substr(0, 3) == "INC") {
            sGroupOverrideSearch = MainWin.g_form.getValue("location");
            sRoleQueryPart = sINCQuery;
           } else {
            grRITM = MainWin.g_form.getReference("request_item");
            if (grRITM) {
              sCurASG = MainWin.g_form.getValue("assignment_group");
              if (grRITM.assignment_group == sCurASG) {
                if (grRITM.assigned_to) {
                  grUser = new MainWin.GlideRecord("sys_user");
                  grUser.get(grRITM.assigned_to);
                  if (grUser.active == "true") {
                    AppendRunLog("RITM found with same assignment group and an assignee. Setting tech list to assignee and calling WorkflowTenet() directly.");
                    TechnicianAssignmentByAccountJSON = [["User", grRITM.assigned_to]];
                    DoWorkflow();
                    return;
                  }
                }
              }
            }
            oServiceLocation = MainWin.gel(FindVariableID4Text("Affected User Location"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("Current Location"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("Location"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("Location:"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("SName of Location to Inactivate"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("Name of Location to Modify"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("Please Select \"\"Service/Support Location\"\": ( If Location doesn't exist then firstly submit new Location request separately)"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("Please Select \"Service/Support Location\":"));
            if (!oServiceLocation) oServiceLocation = MainWin.gel(FindVariableID4Text("Service/Support Location"));
            if (!oServiceLocation) {
              grUser = MainWin.g_form.getReference("request_item.request.requested_for");
              if (!grUser) {
                oServiceLocation = MainWin.gel(FindVariableID4Text("Termed User Manager"));
                if (oServiceLocation) {
                  grUser = MainWin.g_form.getReference(oServiceLocation.id);
                  if (grUser) {
                    sGroupOverrideSearch = grUser.location;
                  }
                }
              } else {
                sGroupOverrideSearch = grUser.location;
              }
            }
            if (oServiceLocation) {
              sGroupOverrideSearch = oServiceLocation.value;
            }
            sRoleQueryPart = sREQGenQuery;
          }
          break;
        case "TxDOT":
          if (sNumber.substr(0, 3) == "INC") {
            sRoleQueryPart = sINCQuery;
          } else {
            sRoleQueryPart = sREQGenQuery;
          }
          break;
        case "TxDOT - NOW":
          if (sNumber.substr(0, 3) == "INC") {
            sRoleQueryPart = sINCQuery;
          } else {
            sRoleQueryPart = sREQGenQuery;
          }
          break;
        case "US Bank":
          if (sNumber.substr(0, 3) == "SCT" && (MainWin.g_form.getDisplayBox("assignment_group").value.indexOf(":") > -1 || MainWin.g_form.getDisplayBox("assignment_group").value == "FS_Dispatch Support")) {
            grRITM = MainWin.g_form.getReference("request_item");
            grCatItem = new MainWin.GlideRecord("sc_cat_item");
            grCatItem.get(grRITM.cat_item);
            sGroupOverrideSearch = MainWin.g_form.getValue("short_description") + "::" + grCatItem.name;
          } else {
            sGroupOverrideSearch = "";
          }
          if (WorkflowUSBSVC() == true) {
            SaveAndReturn();
            return;
          } else {
            if (sNumber.substr(0, 3) == "INC") {
              sRoleQueryPart = sINCQuery;
            } else {
              sRoleQueryPart = sREQGenQuery;
            }
          }
          break;
        case "WEST":
          sCI = MainWin.g_form.getValue("cmdb_ci");
          sService = MainWin.g_form.getValue("business_service");
          sHA = MainWin.g_form.getDisplayBox("company").value;
          sCurASG = MainWin.g_form.getValue("assignment_group");

          /*If CI is blank set the respective Unknown CI by Health Authority*/
          if (sNumber.substr(0, 3) == "INC") {
            if (!sService) {
              if (sCI == "") {

                if (sHA == "Northern Health") sCI = "a0a92128dbb65c1cc2a84b4913961962";
                if (sHA == "Interior Health") sCI = "1a29ed2cdb765c1cc2a84b491396190b";
                if (sHA == "Fraser Health") sCI = "6e88ade0db365c1cc2a84b491396198f";
                if (sHA == "Provincial Health Services Authority") sCI = "bb48252cdbf25c1cc2a84b4913961982";
                if (sHA == "NTT DATA Services") sCI = "78f761a0dbf25c1cc2a84b4913961972";
                if (sHA == "Providence Health Care") sCI = "e41761acdb725c1cc2a84b49139619a6";
                if (sHA == "PHSA") sCI = "bb48252cdbf25c1cc2a84b4913961982";
                if (sHA == "Vancouver Coastal Health") sCI = "3869a1a0dbb65c1cc2a84b4913961978";
                if (sHA == "Island Health") sCI = "20f8a564db765c1cc2a84b491396192d";

                MainWin.g_form.setValue('cmdb_ci', sCI);
                MainWin.g_form.flash("cmdb_ci", "#00CC00", 0); //Flash


                //u_transfer_code
                MainWin.g_form.setValue("u_transfer_code", 4);
                //u_transfer_reason
                MainWin.g_form.setValue("u_transfer_reason", "Workflow Dispatch Processing");

              }
            }
          }
          elAdd = MainWin.gel(FindVariableID4Text("Location"));

          if (!elAdd) elAdd = MainWin.gel(FindVariableID4Text("Delivery Facility"));
          if (!elAdd) elAdd = MainWin.gel(FindVariableID4Text("Site"));
          if (!elAdd) elAdd = MainWin.gel(FindVariableID4Text("What location is the device(s) currently located?"));
          if (!elAdd) { AppendRunLog("Find failed. Static check #1."); elAdd = MainWin.gel("ni.VE5747de391bdf54d0e5e933b4cc4bcbe6"); }
          if (!elAdd) { AppendRunLog("Find failed. Static check #2."); elAdd = MainWin.gel("ni.VE4e65ed22db129050fca1a8dad3961918"); }
          if (!elAdd) { AppendRunLog("Find failed. Static check #3."); elAdd = MainWin.gel("ni.VE18d1aeb11b1394100069ca262a4bcbd2"); }
          if (!elAdd) { AppendRunLog("Find failed. Static check #4."); elAdd = MainWin.gel("ni.VEe154c016db1750dcc2a84b49139619c4"); }
          if (!elAdd) { AppendRunLog("Find failed. Static check #5."); elAdd = MainWin.gel("ni.VEd4a3ee8f1bb65c54dd7464e6ec4bcbb3"); }


          if (elAdd) {
            sGroupOverrideSearch = elAdd.value;
          } else {
            // pull location from parent Incident in Incident task
            if (sNumber.substr(0, 3) == "TAS") {
              sGroupOverrideSearch = (function () {
                var grIncident = new GlideRecord('incident');
                grIncident.get(g_form.getValue("incident"));
                return grIncident.location;
              })();
            } else {
              sGroupOverrideSearch = MainWin.g_form.getValue("location");
            }
          }

          if (sNumber.substr(0, 3) == "INC") {
            sRoleQueryPart = sINCQuery;
          }
          if (sNumber.substr(0, 3) == "SCT") {
            sRoleQueryPart = sREQGenQuery;
          }
          break;
          case "Worley":
           
            if (sNumber.substr(0, 3) == "INC") {
                sRoleQueryPart = sINCQuery;
              }
              if (sNumber.substr(0, 3) == "SCT") {
                sRoleQueryPart = sREQGenQuery;
              }
              if (sNumber.substr(0, 3) == "REQ") {
                sRoleQueryPart = sREQGenQuery;
              }
 
            break;

      }

      AppendRunLog("Calling StarDescQuery from CheckTicket - NonPegasus");
      StartDescQuery();

      AppendRunLog("Returning early from CheckTicket without re-firing.");
      return;
    } else {
      //Pegasus
      elPriority = MainWin.document.getElementById('ctl00_ContentPlaceHolder1_tcIncident_tpDetail_ddlPriority');
      if (elPriority) {
        oAssOptions = MainWin.document.getElementById("ctl00_ContentPlaceHolder1_ddlAssignment").getElementsByTagName("option");
        for (var i = 0; i < oAssOptions.length; i++) {
          if (oAssOptions[i].selected) sAssGroup = oAssOptions[i].innerHTML;
        }
        AppendRunLog("Pegasus priority field found. Starting query...");
        StartDescQuery();

        AppendRunLog("Returning early from CheckTicket without re-firing.");
        return;
      }
    }
    AppendRunLog("Recheck Time:2000");
    setTimeout(CheckTicket, 2000);
  }
  else {
    sNumber = "INC1234567";
    sRoleQueryPart = sINCQuery;
    sAssGroup = "SN-NTT_FS_Depot";
    AppendRunLog("Calling StarDescQuery in CheckTicket for nonTicketingEnv");
   }
}

function CloseDispatchWindow() {
  var oButtonArray = {};
  var nZpos = parseInt(gel("DispatchWindow").style.zIndex) + 1;

  oButtonArray.Yes = CloseYes;
  oButtonArray.No = CloseOut;
  oButtonArray.Cancel = function () { jQuery("#dialog-confirm").remove(); };

  jqui_confirm("Would you like to save the log to a file?", "Save log prompt", oButtonArray, nZpos);
}

function CloseLoader() {
  /*Removes loading animation*/
  if (gel("loaderAnim") != undefined) gel("loaderAnim").parentNode.removeChild(gel("loaderAnim"));
  if (gel("LoadingCSS") != undefined) gel("LoadingCSS").parentNode.removeChild(gel("LoadingCSS"));
}


function CloseOut() {
  CloseLoader();
  jQuery("#dialog-confirm").remove();
  if (gel("DispatchWindow") != undefined) gel("DispatchWindow").parentNode.removeChild(gel("DispatchWindow"));
  localStorage.setItem("sADLogUpdate", "CloseOut() - " + new Date().toString());
  VarReset();
}


function CloseYes() {
  var dNow = new Date();
  var sLog = gel("txtLog").innerHTML;

  PromptToSave("WFM_" + String(dNow) + ".log", sLog);
  CloseOut();
}

function ConfigureDispatchInterface() {

  if (jQuery.fn.jquery.split(".")[0] > 1 || jQuery.fn.jquery.split(".")[1] > 6) {
    sJQUIURL =   sNTTScriptPath +"scripts/DWSUtilitiesScript.jqueryui_min1121.js";
    sJQUICSSURL = sNTTScriptPath + "jquery-ui.css";
  } else {
    sJQUIURL =   sNTTScriptPath + "scripts/DWSUtilitiesScript.jqueryui_min184.js";
    sJQUICSSURL = sNTTScriptPath + "jquery-ui.css";
  }



  jQuery.ajax({
    url: sJQUIURL,
    dataType: "script",
    success: function (data, textStatus, xhr) {
      var oHead = document.getElementsByTagName("head")[0];
      var oCSSLink = document.createElement("link");
      var oSNAPCSS = document.createElement("link");
      oCSSLink.id = "JQueryUICSS";
      oCSSLink.rel = "stylesheet";
      oCSSLink.onload = ContinueLoad;
      oSNAPCSS.id = "SNAPCSS";
      oSNAPCSS.rel = "stylesheet";
      oSNAPCSS.onload = ContinueLoad;
      oSNAPCSS.onload = SetupDispatchInterface;
      oCSSLink.href = sJQUICSSURL;
      oSNAPCSS.href = sNTTScriptPath + "SNAP.min.css";
      oHead.appendChild(oCSSLink);
      oHead.appendChild(oSNAPCSS);
    },
    error: function (xhr, textStatus, errorThrown) {
      console.log("error: " + textStatus);
    }
  });
}

function ContinueLoad() {
  /*This ensures that all CSS is loaded before any DOM elements are instantiated*/
  sLoadTrack = sLoadTrack + this.id;
  if (sLoadTrack.length > 7) SetupDispatchInterface();
}

function CountTickets(gr, sName, nIndex) {
  var nCurCount = 0;
  var nActiveTickets = 0;
  var sTotalLine = "";

  nCountTicketRun++;

  if (!(arrTicketLog[nIndex])) arrTicketLog[nIndex] = [];

  while (gr.next()) {
    if (!(arrTicketLog[nIndex][0])) arrTicketLog[nIndex][0] = "";
    if (nActiveTickets < 12) arrTicketLog[nIndex][0] += "\n" + gr.number;
    if (nActiveTickets == 12) arrTicketLog[nIndex][0] += "\n[Truncated List]";
    nActiveTickets++;
  }

  nCurCount = TechnicianAssignmentByAccountJSON[nIndex]['CurCount'];
  AppendRunLog("nCurCount: " + String(nCurCount));

  AppendRunLog(sName + "'s Tickets: " + nActiveTickets);
  TechnicianAssignmentByAccountJSON[nIndex]['CurCount'] = nCurCount + nActiveTickets;
  arrTicketLog[nIndex][1] = TechnicianAssignmentByAccountJSON[nIndex]['CurCount'];

  if (nCountTicketRun >= nGetTicketRun) {
    for (var i = 0; i < TechnicianAssignmentByAccountJSON.length; i++) {
      sTotalLine = TechnicianAssignmentByAccountJSON[i]['Name'] + "'s active tickets: " + String(TechnicianAssignmentByAccountJSON[i]['CurCount']);
      AppendRunLog(sTotalLine);
      sUpdateNotes += sTotalLine + "\n";
      AppendRunLog("TechnicianAssignmentByAccountJSON[" + String(i) + "]['CurCount'] = " + String(TechnicianAssignmentByAccountJSON[i]['CurCount']));
    }

    /*Re-sort tech list based on ticket count*/
    AppendRunLog("Before sort: " + String(TechnicianAssignmentByAccountJSON));
    TechnicianAssignmentByAccountJSON.sort(function (a, b) { return a[4] - b[4]; });
    arrTicketLog.sort(function (a, b) { return a[1] - b[1]; });
    AppendRunLog("After sort: " + String(TechnicianAssignmentByAccountJSON));

    nGetTicketRun = 0;
    nCountTicketRun = 0;

    LogAssign();
  }
}

function DoSelfAssign() {
  var fortnightAway = new Date(Date.now() + 12096e5);
  var NewDate = "";


  switch (sAccount) {
    case "Bombardier":
      MainWin.g_form.setValue("assigned_to", "");
      sAssignedTo = "";
      break;
    case "Tenet":
      var sCategory = "";
      var sSubCategory = "";
      var sIssueType = "";
      var nLOOPTIMEOUT_MS = 30000;
      var nLOOPCHECK_MS = 250;

      MainWin.g_form.setValue("assigned_to", "ac4b4f84db93c05068b8aca2ca9619ae");
      sAssignedTo = "Jessie Bell";


      if (sNumber.slice(0, 3) == "INC") {

        sCategory = MainWin.g_form.getValue("category");
        sSubCategory = MainWin.g_form.getValue("subcategory");
        sIssueType = MainWin.g_form.getValue("u_issue_type");

        if (MainWin.g_form.getValue("u_service_support_phone") == "") {
          MainWin.g_form.setValue("u_service_support_phone", "NA");
        }
        if (MainWin.g_form.getValue("u_service_support_email") == "") {
          MainWin.g_form.setValue("u_service_support_email", "NA");
        }

        if (sIssueType == "") {
          switch (sCategory) {
            case "Printer": MainWin.g_form.setValue("u_issue_type", "User Hardware"); break;
            case "Network": MainWin.g_form.setValue("u_issue_type", "User Software"); break;
            case "Operations": MainWin.g_form.setValue("u_issue_type", "User Software"); break;
            case "Workstation (Desktop/Laptop)": MainWin.g_form.setValue("u_issue_type", "User Hardware"); break;
            case "Voice/Telecom": MainWin.g_form.setValue("u_issue_type", "User Hardware"); break;
            default: MainWin.g_form.setValue("u_issue_type", "User Software"); break;
          }
          MainWin.g_form.flash("u_issue_type", "#00CC00", 0); //Flash    
        }

        if (sCategory == "") {
          AppendRunLog("Category is blank. Setting it to Workstation.");
          MainWin.g_form.setValue("category", "Workstation (Desktop/Laptop)");
          MainWin.g_form.flash("category", "#00CC00", 0); //Flash

          AppendRunLog("Setting subcategory to [Blank].");
          MainWin.g_form.setValue("subcategory", "[Blank]");

          AppendRunLog("Initiating LoopCheckCondition loop.");
          LoopCheckCondition(function () {
            var sCategory = MainWin.g_form.getValue("category");
            var sSubCat = MainWin.g_form.getValue("subcategory");
            AppendRunLog("sCategory/sSubCat check. (sCategory:" + sCategory + ",sSubCat:" + sSubCat + ")");
            return (sCategory != "" && sSubCat != "[Blank]");
          }, function () {
            var sCategory = MainWin.g_form.getValue("category");
            var sSubCat = MainWin.g_form.getValue("subcategory");
            switch (sCategory) {
              case "Application/Software": MainWin.g_form.setValue("subcategory", "Operations"); break;
              case "Printer": MainWin.g_form.setValue("subcategory", "Multi-Function/Scanner/Printer/Fax"); break;
              case "Network": MainWin.g_form.setValue("subcategory", "Internet Connectivity"); break;
              case "Workstation (Desktop/Laptop)": MainWin.g_form.setValue("subcategory", "Desktop"); break;
              case "Voice/Telecom": MainWin.g_form.setValue("subcategory", "ACD"); break;
              default:
                AppendRunLog("Subcategory is blank, but Category is not matched. Category:" + sCategory);
                return;
     
            }
            MainWin.g_form.flash("sub_category", "#00CC00", 0); //Flash

            AppendRunLog("Ticket data set. Updating workflow log...");
            AppendToolLog("Ticket data set. Updating workflow log...");
            UpdateWorkflowLog();
          }, nLOOPTIMEOUT_MS, nLOOPCHECK_MS);
        } else {
          AppendRunLog("Category is non-blank. Immediately setting subcategory.");
          sSubCategory = MainWin.g_form.getValue("subcategory");
          if (sSubCategory == "") {
            switch (sCategory) {
              case "Application/Software": MainWin.g_form.setValue("subcategory", "Operations"); break;
              case "Printer": MainWin.g_form.setValue("subcategory", "Multi-Function/Scanner/Printer/Fax"); break;
              case "Network": MainWin.g_form.setValue("subcategory", "Internet Connectivity"); break;
              case "Workstation (Desktop/Laptop)": MainWin.g_form.setValue("subcategory", "Desktop"); break;
              case "Voice/Telecom": MainWin.g_form.setValue("subcategory", "ACD"); break;
              default:
                AppendRunLog("Subcategory is blank, but Category is not matched. Category:" + sCategory);
                return;
          
            }
          }
        }
      }
      break;
    case "TxDOT - NOW":
      MainWin.g_form.setValue("assigned_to", "f22798b413d73244fda23998d144b0b6");
      sAssignedTo = "Scott Wynkoop-C";
      break;
    case "Fifth Third Bank":
      NewDate = SetTwoWeeks(fortnightAway);
      MainWin.g_form.setValue("assigned_to", MainWin.g_user.getUserID());
      sAssignedTo = MainWin.g_user.fullName;
      if (MainWin.g_form.getValue("sc_task.u_pending_end_date_time") == "") {
        MainWin.g_form.setValue("sc_task.u_pending_end_date_time", NewDate);
      }

      break;
    case "US Bank":
      MainWin.g_form.setValue("assigned_to", MainWin.g_user.getUserID());
      sAssignedTo = MainWin.g_user.fullName;
      AcceptTicket();
      break;
    case "Worley":
        MainWin.g_form.setValue("assigned_to", MainWin.g_user.getUserID());
        AssignedTo = MainWin.g_form.getReference("assigned_to");
        sAssignedTo = AssignedTo.name;
        sAssignedToEmail = AssignedTo.email;
        break;
    default:
      MainWin.g_form.setValue("assigned_to", MainWin.g_user.getUserID());
      sAssignedTo = MainWin.g_user.fullName;
      
  }

  if (sAssGroup == "FTB - FS - Procurement") {
  } 
  else 
  {
    UpdateWorkflowLog();
  }
}

function DoWorkflow() {  // BG - This method shouldn't be executed if the Window is not ticketing tool.  
  var bFTBFlag = false;
  GenerateCodeStamp("DSPT");

  for (var i = 0; i < TechnicianAssignmentByAccountJSON.length; i++) {
    if (arrTicketLog[i]) {
      sTicketLog += "\n\n" + TechnicianAssignmentByAccountJSON[i]['Name'] + "'s active tickets...";
      if (String(arrTicketLog[i][0]) == "undefined") {
        sTicketLog += "\n[None]";
      } else {
        sTicketLog += String(arrTicketLog[i][0]).replace("undefined", "");
      }
    }
  }

  switch (sAccount) {
    case "AMGEN": WorkflowAMGEN(); break;
    case "AMITA": WorkflowAMITA(); break;
    case "Bombardier": WorkflowBomb(); break;
    case "Banamex": WorkflowBanamex(); break;
    case "Cedars-Sinai": WorkflowCSMC(); break;
    case "Corteva": WorkflowCorteva(); break;
    case "Fifth Third Bank":
      bFTBFlag = (sShortDesc.substr(0, 28) == "New/Upgrade Hardware Request");
      WorkflowFifthThird(bFTBFlag); break;
    case "Grupo Bimbo": WorkflowGB(); break;
    case "Guardian": WorkflowGuardian(); break;
    case "Independent Health": WorkflowIHA(); break;
    case "Magellan": WorkflowMagellan(); break;
    case "Novelis": NovelisAssignCheck(); break;
    case "MedStar": WorkflowMedStar(); break;
    case "SunCoke Energy": WorkflowSuncoke(); break;
    case "Tenet":
      WorkflowTenet(); //For Tenet UpdateWorkflowLog() next step is called in function itself on account of asynchronous form updates
      return;
      
    case "Tollbrothers": WorkflowTollBrothers(); break;
    case "TxDOT": WorkflowTxDOT(); break;
    case "TxDOT - NOW": WorkflowTxDOTNow(); break;
    case "Vanderbilt": WorkflowPeg(); break;
    case "US Bank": WorkflowUSBank(); break;
    case "WEST": WorkflowWEST(); break;
    case "Worley": WorkflowWorley(); break;
  }

  AppendRunLog("Ticket data set. Updating workflow log...");
  UpdateWorkflowLog();
}

function FieldComparison(oVariable, sField) {
  var sName = Object.keys(oVariable)[0];
  var sCurValue = MainWin.g_form.getValue(sField);

  if (sCurValue != oVariable[sName]) {
    sUpdatedFieldList += sField + ";";
  }

  eval(sName + " = '" + sCurValue + "';");
}

/*
function FindMainWin() {
  var oMainFrame;

  if (gel(sFrame) == undefined) {
    oMainFrame = gel("FullFrame");
    if (oMainFrame == undefined) {
      oMainFrame = document.createElement("iframe");
      oMainFrame.style.cssText = "position:absolute; top:0px; left:0px; width:100%; height:100%; overflow:hidden;";
      oMainFrame.src = window.location.href
      oMainFrame.id = "FullFrame";
      document.body.appendChild(oMainFrame);
    }
    return gel("FullFrame").contentWindow;
  } else {
    return gel(sFrame).contentWindow;
  }
}*/

function FindMainWin() {

  var oMainFrame;

  if (!gel(sFrame)) {

      if (typeof gsft_main != "undefined") {

          return gsft_main;

      } else {

          oMainFrame = gel("FullFrame");

          if (oMainFrame == undefined) {

              oMainFrame = document.createElement("iframe");

              oMainFrame.style.cssText = "position:absolute; top:0px; left:0px; width:100%; height:100%; overflow:hidden;";

              oMainFrame.src = window.location.href;

              oMainFrame.id = "FullFrame";

              document.body.appendChild(oMainFrame);

          }

          return gel("FullFrame").contentWindow;

      }

  } else {

      return gel(sFrame).contentWindow;

  }

}

function FindVariableID4Text(sInput) {
  var arrSpanTips = MainWin.document.querySelectorAll("span.sn-tooltip-basic");
  var sForID = "";
  for (var i = 0; i < arrSpanTips.length; i++) {
    if (arrSpanTips[i].innerText == sInput) {
      sForID = arrSpanTips[i].parentElement.getAttribute("for");
      if (sForID.substr(0, 12) == "sys_display.") sForID = sForID.substr(12);
      console.log(sForID);
      if (MainWin.gel(sForID).value != "") return sForID;
    }
  }
}


function FTBSwivelClose() {
  MainWin.g_form.addInfoMessage("Device Request added to FTB-CDM-Procurement");
  MainWin.g_form.setValue("state", "3");
  MainWin.g_form.flash("state", "#00CC00", 0); //Flash
  MainWin.g_form.setValue("work_notes", "Device Request submitted to FTB-CDM-Procurement. Task closed.");
  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
  UpdateWorkflowLog();
}



function GenerateCodeStamp(sActionCode) {
  var dNow = new Date();
  var nOffset = null;

  sHH = dNow.getHours().toString();
  sMS = dNow.getMinutes().toString();
  sDD = dNow.getDate().toString();
  sYY = dNow.getFullYear().toString().substr(2);
  sMM = dNow.getMonth();

  sMM++;
  sMM = sMM.toString();

  sMM = PadZero(sMM);
  sDD = PadZero(sDD);
  sHH = PadZero(sHH);
  sMS = PadZero(sMS);

  Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  };

  Date.prototype.DST = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
  };

  nOffset = dNow.getTimezoneOffset() / 60;

  if (dNow.DST()) {
    switch (nOffset) {
      case 9.5: sZone = "PF"; break;
      case 8: sZone = "AK"; break;
      case 7: sZone = "PT"; break;
      case 6: sZone = "MT"; break;
      case 5: sZone = "CT"; break;
      case 4: sZone = "ET"; break;
      case 2.5: sZone = "NT"; break;
      default:
        if (nOffset < 0) {
          switch (nOffset.toString()) {
            case "-3.5": sZone = "-f"; break;
            case "-4.5": sZone = "-g"; break;
            case "-5.5": sZone = "-h"; break;
            case "-5.75": sZone = "-i"; break;
            case "-6.5": sZone = "-j"; break;
            case "-8.75": sZone = "-k"; break;
            case "-9.5": sZone = "-l"; break;
            case "-10.5": sZone = "-m"; break;
            case "-12.75": sZone = "-n"; break;
            default: sZone = nOffset.toString(24); break;
          }
        } else {
          sZone = PadZero(nOffset);
        }
        break;
    }
  } else {
    switch (nOffset) {
      case 9.5: sZone = "PF"; break;
      case 9: sZone = "AK"; break;
      case 8: sZone = "PT"; break;
      case 7: sZone = "MT"; break;
      case 6: sZone = "CT"; break;
      case 5: sZone = "ET"; break;
      case 3.5: sZone = "NT"; break;
      default:
        if (nOffset < 0) {
          switch (nOffset.toString()) {
            case "-3.5": sZone = "-f"; break;
            case "-4.5": sZone = "-g"; break;
            case "-5.5": sZone = "-h"; break;
            case "-5.75": sZone = "-i"; break;
            case "-6.5": sZone = "-j"; break;
            case "-8.75": sZone = "-k"; break;
            case "-9.5": sZone = "-l"; break;
            case "-10.5": sZone = "-m"; break;
            case "-12.75": sZone = "-n"; break;
            default: sZone = nOffset.toString(24); break;
          }
        } else {
          sZone = PadZero(nOffset);
        }
        break;
    }
  }

  sActionDTStamp = sYY + "/" + sMM + "/" + sDD + ";" + sHH + sMS + "_" + sZone;
  sCodeStamp = sActionDTStamp.replace(";", " " + sActionCode + " ");
  sCodeStamp = sCodeStamp.replace("_", " ");
}



function GetActiveTickets(sSysID, sTechName, nTechIndex, sDescField, sTable, sStateField, arrExcludeStates) {
  var grTicket = new MainWin.GlideRecord(sTable);

  nGetTicketRun++;

  /*Volume-based dispatching for all accounts besides WEST*/
  if (sAccount == "WEST") grTicket.addQuery(sDescField, "CONTAINS", " ADAC");

  for (var i = 0; i < arrExcludeStates.length; i++) {
    grTicket.addQuery(sStateField, "!=", arrExcludeStates[i]);
  }
  grTicket.addQuery("assigned_to", sSysID);
  grTicket.query(function (gr) { CountTickets(gr, sTechName, nTechIndex); });
}

function SetTwoWeeks(Fortnight) {

  var date = Fortnight;
  var aaaa = date.getFullYear();
  var gg = date.getDate();
  var mm = (date.getMonth() + 1);

  if (gg < 10)
    gg = "0" + gg;

  if (mm < 10)
    mm = "0" + mm;

  var cur_day = aaaa + "-" + mm + "-" + gg;

  var hours = date.getHours()
  var minutes = date.getMinutes()
  var seconds = date.getSeconds();

  if (hours < 10)
    hours = "0" + hours;

  if (minutes < 10)
    minutes = "0" + minutes;

  if (seconds < 10)
    seconds = "0" + seconds;

  return cur_day + " " + hours + ":" + minutes + ":" + seconds;

}

function GetCurrentDT() {
  var curNow = new Date();
  var sMonth = String(curNow.getMonth() + 1);
  var sDay = String(curNow.getDate());
  var sYear = String(curNow.getFullYear());
  var sHour = String(curNow.getHours());
  var sAP = "AM";
  var sDTStamp;

  if (sMonth.length < 2) sMonth = "0" + sMonth;
  if (sDay.length < 2) sDay = "0" + sDay;
  if (curNow.getHours() > 11) {
    sHour = String(curNow.getHours() - 12);
    sAP = "PM";
  }
  if (sHour.length < 2) sHour = "0" + sHour;

  sDTStamp = sMonth + "-" + sDay + "-" + sYear + " " + sHour + ":" + String(curNow.getMinutes()) + " " + sAP;

  return sDTStamp;
}



function GetFNReq() {
  var sAssignedID = gel("ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlAssignedTo").value;
  var options = gel("ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlAssignedTo").childNodes;
  var sReturn = "";
  for (var i = 0; i < options.length; i++) {
    if (options[i].value == sAssignedID) {
      sReturn = options[i].innerHTML;
      break;
    }
  }
  return sReturn;
}



function GetScript(source, callback) {
  var script = document.createElement('script');
  var prior = document.getElementsByTagName('script')[0];
  script.async = 1;

  script.onload = script.onreadystatechange = function (_, isAbort) {
    if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
      script.onload = script.onreadystatechange = null;
      script = undefined;

      if (!isAbort) { if (callback) callback(); }
    }
  };

  script.src = source;
  prior.parentNode.insertBefore(script, prior);
}

function GetVarID(sInput) {
  var oLabelArray = MainWin.document.getElementsByTagName("label");
  var sLabelInnerHTML = "";
  var sReturnID = "";

  for (i = 0; i < oLabelArray.length; i++) {
    sLabelInnerHTML = oLabelArray[i].innerHTML;
    if (sLabelInnerHTML.indexOf(sInput) > -1) {
      sReturnID = oLabelArray[i].htmlFor;
    }
    sLabelInnerHTML = "";
  }

  return sReturnID;
}

function jqui_confirm(sMessage, sTitle, arrButtons, zOrder) {
  var oDialog = document.createElement("div");
  var oParagraph = document.createElement("p");
  var oSpan = document.createElement("span");
  oDialog.id = "dialog-confirm";
  oDialog.title = sTitle;
  oSpan.class = "ui-icon ui-icon alert";
  oSpan.style = "float:left; margin:12px 12px 20px 0;";
  oParagraph.innerHTML = sMessage;
  oParagraph.appendChild(oSpan);
  oDialog.appendChild(oParagraph);
  document.body.appendChild(oDialog);

  jQuery(function () {
    jQuery("#dialog-confirm").dialog({
      resizable: false,
      height: "auto",
      width: 400,
      modal: true,
      buttons: arrButtons,
      close: function () {
        jQuery("#dialog-confirm").remove();
      }
    });
  });

  jQuery("[aria-describedby='dialog-confirm']").css("z-index", String(zOrder));
}



function LogAssign() {
  // //Need to revisit this whole approach to transition to OutSystems
  var PostData = {
    "TechnicianId": + TechnicianAssignmentByAccountJSON[0]['TechnicianId']
  };
  var PostUrl = sNTTAPIURL + 'rest/V2/SetTechnicianAssigned/';
  console.log(JSON.stringify(PostData));
  AppendRunLog(JSON.stringify(PostData));
  AppendToolLog(JSON.stringify(PostData));
  jQuery.ajax({
    url: PostUrl,
    type: 'POST',
    headers: {
      'AppId': AppID,
      'ApiKey': APIKey
    },
    data: JSON.stringify(PostData),
    success: DoWorkflow,
    error: function (error) {
      AppendRunLog(error);
      AppendToolLog(error);
    }
  });
}


function LoopCheckCondition(func_check, func_execute, nTimeoutMS, nCheckMS) {
  var nTimeoutAttempts = nTimeoutMS / nCheckMS;

  if (nCurLoopCheck == 0) ShowLoader();

  AppendRunLog("func_check:" + String(func_check));
  AppendRunLog("[See browser console for function object.]");
  console.log("func_check...");
  console.log(func_check);

  if (func_check()) {
    AppendRunLog("func_check true, executing func_execute.");
    nCurLoopCheck = 0;
    CloseLoader();
    func_execute();
  } else {
    if (nCurLoopCheck < nTimeoutAttempts) {
      AppendRunLog("func_check false, checking again.");
      nCurLoopCheck++;
      setTimeout(function () { LoopCheckCondition(func_check, func_execute, nTimeoutMS, nCheckMS); }, nCheckMS);
    } else {
      AppendRunLog("LoopCheckCondition Timeout.");
      CloseLoader();
    }
  }
}


function NoteMisroute() {
  GenerateCodeStamp("MSRT");

  switch (sAccount) {
    case "AMGEN":
      sShortDesc = MainWin.g_form.getValue("description");
      if (SDContainsCode()) {
        MainWin.g_form.setValue("description", sCodeStamp + "\n\n" + sShortDesc.substr(23));
      } else {
        MainWin.g_form.setValue("description", sCodeStamp + "\n\n" + sShortDesc);
      }
      MainWin.g_form.flash("description", "#00CC00", 0); //Flash
      break;
    case "AMITA":
      MainWin.g_form.setValue("u_desktop_status", sCodeStamp);
      MainWin.g_form.flash("u_desktop_status", "#00CC00", 0); //Flash
      UpdateBlankPriorityFields();
      break;
    case "Bombardier":
      if (sNumber.substr(0, 3) == "INC") {
        MainWin.g_form.setValue("u_ntt_status_code", sCodeStamp);
        MainWin.g_form.flash("u_ntt_status_code", "#00CC00", 0); //Flash
      } else {
        if (SDContainsCode()) {
          MainWin.g_form.setValue("short_description", sCodeStamp + "\n\n" + sShortDesc.substr(23));
        } else {
          MainWin.g_form.setValue("short_description", sCodeStamp + "\n\n" + sShortDesc);
        }
      }
      break;
    case "Caterpillar":
      sShortDesc = MainWin.g_form.getValue("short_description");
      if (SDContainsCode()) {
        TOT = parseFloat(sShortDesc.substr(23, 3)) || 0;
        TOT = TOT + 2;
        TOT = String("00" + TOT);
        TOT = TOT.substr(TOT.length - 3);
        MainWin.g_form.setValue("short_description", sCodeStamp + " (" + TOT + ") - " + sShortDesc.substr(28));
      } else {
        MainWin.g_form.setValue("short_description", sCodeStamp + " (002) - " + sShortDesc);
      }
      MainWin.g_form.flash("short_description", "#00CC00", 0); //Flash
      break;
    case "Cedars-Sinai":
      sShortDesc = MainWin.g_form.getValue("description");
      if (SDContainsCode()) {
        MainWin.g_form.setValue("description", sCodeStamp + "\n\n" + sShortDesc.substr(23));
      } else {
        MainWin.g_form.setValue("description", sCodeStamp + "\n\n" + sShortDesc);
      }
      MainWin.g_form.flash("description", "#00CC00", 0); //Flash
      break;
    case "Grupo Bimbo":
      sShortDesc = MainWin.g_form.getValue("short_description");
      if (SDContainsCode()) {
        MainWin.g_form.setValue("short_description", sCodeStamp + " - " + sShortDesc.substr(23));
      } else {
        MainWin.g_form.setValue("short_description", sCodeStamp + " - " + sShortDesc);
      }
      MainWin.g_form.flash("short_description", "#00CC00", 0); //Flash
      break;
    case "Vanderbilt":
      gel('ctl00_ContentPlaceHolder1_txtSupportStatusCode').value = sCodeStamp;
      break;
  }

  AppendRunLog("Short Description updated.");
}



function NovelisAssignCheck() {
  var sGroupID = MainWin.g_form.getValue("assignment_group");
  var sOpened = MainWin.g_form.getValue("opened_by");
  var grGroupAssignment = new MainWin.GlideRecord("sys_user_grmember");

  grGroupAssignment.addQuery("group", sGroupID);
  grGroupAssignment.query(function (gr) {
    while (gr.next()) {
      if (gr.user == sOpened) {
        WorkflowNovelis(sOpened);
        return;
      }
    }
    WorkflowNovelis(TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  });
}

function PadZero(sInput)
 { 
  sInput = "0" + sInput;
   return sInput.substr(-2); 
}

function ProcessAssignment() {
  var arrExcludeStatesInc = [];
  var arrExcludeStatesTask = [];
  var arrExcludeStatesMove = []; //Guardian
  var arrExcludeStatesChange = []; //TxDOT
  var arrExcludeStatesCTask = []; //TxDOT
  var arrExcludeStatesMTask = []; //TxDOT - NOW
  var arr
  var sIncStateField = "state";
  var sTaskStateField = "state";
  var sMoveStateField = "state";
  var i; //Used for two for loops
  var i2;
  var sOrigDescriptionField = "";
  var bFound = false;

  switch (sAccount) {
    case "AIG":
      sDescField = "u_dell_status_code";
      arrExcludeStatesInc = ["6", "7", "8"];
      arrExcludeStatesTask = ["3", "4"];
      break;
    case "AMGEN":
      arrExcludeStatesInc = ["5", "6", "7"];
      arrExcludeStatesTask = ["-5", "3"];
      break;
    case "AMITA":
      sDescField = "u_desktop_status"; //Override, since status is checked in special field
      sIncStateField = "incident_state";
      arrExcludeStatesInc = ["6", "7"];
      arrExcludeStatesTask = ["4", "5"];
      break;
    case "Bombardier":
      arrExcludeStatesInc = ["6"];
      arrExcludeStatesTask = ["-5", "3"];
      break;
    case "Caterpillar":
      arrExcludeStatesInc = ["6", "7", "8"];
      arrExcludeStatesTask = ["-5", "3", "4", "7"];
      break;
    case "Cedars-Sinai":
      arrExcludeStatesInc = ["6", "7", "10"];
      arrExcludeStatesTask = ["-5", "3", "10"];
      break;
    case "Fifth Third Bank":
      arrExcludeStatesInc = ["-5", "2", "6"];
      arrExcludeStatesTask = ["-5", "3", "4", "7"];
      sIncStateField = "incident_state";
      break;
    case "Grupo Bimbo":
      arrExcludeStatesInc = ["6", "7"];
      arrExcludeStatesTask = ["3", "4", "7", "8"];
      break;
    case "Guardian":
      sDescField = "u_dell_status_code"; //Override, since status is checked in special field
      arrExcludeStatesInc = ["6", "7", "12"];
      arrExcludeStatesTask = ["3", "4", "7"];
      arrExcludeStatesMove = ["-5", "3", "4", "7"];
      break;
    case "Independent Health":
      arrExcludeStatesInc = ["-5", "6"];
      arrExcludeStatesTask = ["-5", "3", "4", "7"];
      sIncStateField = "incident_state";
      break;
    case "Magellan":
      arrExcludeStatesInc = ["6", "7", "8"];
      arrExcludeStatesTask = ["3", "4"];
      sIncStateField = "incident_state";
      break;
    case "Novelis": //Needs verifying
      arrExcludeStatesInc = ["6", "7", "8"];
      arrExcludeStatesTask = ["3", "4"];
      sIncStateField = "incident_state";
      break;
    case "MedStar":
      arrExcludeStatesInc = ["-5", "3", "4", "7"];
      arrExcludeStatesTask = ["-5", "6"];
      sIncStateField = "incident_state";
      break;
    case "SunCoke Energy":
      arrExcludeStatesInc = ["3", "6", "8"];
      arrExcludeStatesTask = ["-5", "3", "4", "7"];
    case "Tenet":
      arrExcludeStatesInc = ["6", "7", "8"];
      arrExcludeStatesTask = ["3", "4", "7"];
      sIncStateField = "incident_state";
      break;
    case "TxDOT":
      arrExcludeStatesInc = ["-5", "6", "7"];
      arrExcludeStatesTask = ["-5", "3", "4", "7"];
      arrExcludeStatesChange = ["1", "2", "3", "4", "5", "7", "8", "9"];
      arrExcludeStatesCTask = ["5", "3", "4", "7", "11"];
      sIncStateField = "incident_state";
      break;
    case "TxDOT - NOW":
      arrExcludeStatesInc = ["-5", "5", "6"];
      arrExcludeStatesTask = ["3", "4", "7"];
      arrExcludeStatesMTask = ["-5", "3", "4", "7"];
      sIncStateField = "incident_state";
      break;
    case "WEST":
      arrExcludeStatesInc = ["6", "7"];
      arrExcludeStatesTask = ["3", "4", "7"];
      sIncStateField = "incident_state";
      break;
    case "US Bank":
      sDescField = "description";
      arrExcludeStatesInc = ["6", "7", "8"];
      arrExcludeStatesTask = ["3", "7"];
      sIncStateField = "incident_state";
      break;
    case "Vanderbilt":
      //Needs modification to be really useable
      sDescField = "";
      arrExcludeStatesInc = "0";
      arrExcludeStatesTask = "0";
      sLoadTime = "0";
      AppendRunLog("LogAssign() called.");
      LogAssign();
      return;
    
      case "Worley":
        arrExcludeStatesInc = ["6", "7"];
        arrExcludeStatesTask = ["3", "4","7"];
        break;
  }
  AppendRunLog("Technician.length:" + String(TechnicianAssignmentByAccountJSON.length));

  if(TechnicianAssignmentByAccountJSON == null) TechnicianAssignmentByAccountJSON = "";
  
  AppendRunLog("TechnicianAssignmentByAccountJSON.length:" + String(TechnicianAssignmentByAccountJSON.length));
  AppendRunLog("arrCheckAssignment.length:" + String(arrCheckAssignment.length));

/*
  for (i = TechnicianAssignmentByAccountJSON.length - 1; i >= 0; i--) {
    //Revised group match matrix OPPM availability check here
    if (!TechnicianAssignmentByAccountJSON[i]['Availability']) {
      TechnicianAssignmentByAccountJSON.splice(i, 1);
      AppendRunLog("Tech[" + String(i) + "] is Inactive. Removing from array.");
    }
  }


  for (i = TechnicianAssignmentByAccountJSON.length - 1; i >= 0; i--) {
    for (i2 = arrCheckAssignment.length - 1; i2 >= 0; i2--) {

      if (arrCheckAssignment[i2] == TechnicianAssignmentByAccountJSON[i]['Sys_ID']) {
        bFound = true;
      }
    }
    if (!bFound) {
      TechnicianAssignmentByAccountJSON.splice(i, 1);
      AppendRunLog("Tech[" + String(i) + "] is not Part of the Assignment group. Removing from array.");

    }
    bFound = false
  }
*/
  switch (TechnicianAssignmentByAccountJSON.length) {
    case 0:
      sPriority = "[Unknown]";
      AppendRunLog("No technicians available at the present date/time. Self-assigning.");
      AppendToolLog("No technicians available at the present date/time. Self-assigning.");
      sUpdateNotes += "No available techs. Self-assign fallback.";
      DoSelfAssign();
      break;
    case 1:
      AppendRunLog("Solitary group member found Active. Skipping straight to assign.");
      AppendToolLog("Solitary group member found Active. Skipping straight to assign.");
      sUpdateNotes += "Only one active group member found.";
      LogAssign();
      break;
    default:
      for (i = 0; i < TechnicianAssignmentByAccountJSON.length; i++) {
        TechnicianAssignmentByAccountJSON[i]['CurCount'] = 0;
        sOrigDescriptionField = sDescField;
        if (sAccount == "AIG") sDescField = "u_dell_action_code";
        AppendRunLog("GetActiveTickets('" + String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']) + "', '" + String(TechnicianAssignmentByAccountJSON[i]['Name']) + "', " + String(i) + ", '" + sDescField + "', '" + String(arrExcludeStatesInc) + "')");
        GetActiveTickets(String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']), String(TechnicianAssignmentByAccountJSON[i]['Name']), i, sDescField, "incident", sIncStateField, arrExcludeStatesInc);
        if (sAccount == "AIG") sDescField = "u_dell_ticket_code";
        AppendRunLog("GetActiveTickets('" + String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']) + "', '" + String(TechnicianAssignmentByAccountJSON[i]['Name']) + "', " + String(i) + ", '" + sDescField + "', '" + String(arrExcludeStatesTask) + "')");
        GetActiveTickets(String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']), String(TechnicianAssignmentByAccountJSON[i]['Name']), i, sDescField, "sc_task", sTaskStateField, arrExcludeStatesTask);
        sDescField = sOrigDescriptionField;
        if (sAccount == "Guardian") GetActiveTickets(String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']), String(TechnicianAssignmentByAccountJSON[i]['Name']), i, sDescField, "u_move_task", sMoveStateField, arrExcludeStatesMove);
        if (sAccount == "TxDOT") GetActiveTickets(String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']), String(TechnicianAssignmentByAccountJSON[i]['Name']), i, sDescField, "change_request", sTaskStateField, arrExcludeStatesChange);
        if (sAccount == "TxDOT") GetActiveTickets(String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']), String(TechnicianAssignmentByAccountJSON[i]['Name']), i, sDescField, "change_task", sTaskStateField, arrExcludeStatesCTask);
        if (sAccount == "TxDOT - NOW") GetActiveTickets(String(TechnicianAssignmentByAccountJSON[i]['Sys_ID']), String(TechnicianAssignmentByAccountJSON[i]['Name']), i, sDescField, "u_maintenance_task", sTaskStateField, arrExcludeStatesMTask);
      }
      break;
  }
}

function PromptToSave(sFilename, sText) {
  var oAnchor = document.createElement('a');

  oAnchor.setAttribute("href", "data:text/plain;charset=utf-16," + encodeURIComponent(sText));
  oAnchor.setAttribute("download", sFilename);
  oAnchor.style.display = "none";
  document.body.appendChild(oAnchor);

  oAnchor.click();

  document.body.removeChild(oAnchor);
}

function ProcessFTBQuery() {
  var grTicket = new MainWin.GlideRecord("sc_task");

  grTicket.addQuery("short_description", "STARTSWITH", "New/Upgrade Hardware Request");
  grTicket.addQuery("short_description", "ENDSWITH", "Pull Stock");
  grTicket.addQuery("request_item", MainWin.g_form.getValue("request_item"));

  grTicket.query(function (gr) { HardRequestUpdate(gr); });
}

function HardRequestUpdate(gr) {
  if (gr.assigned_to) {
    MainWin.g_form.setValue("assigned_to", gr.assigned_to);
    switch (sAccount) {
      case "Fifth Third Bank":
        GenerateCodeStamp("PULL");
        WorkflowFifthThird(true);
        break;

    }

    UpdateWorkflowLog();
  } else {
    AppendRunLog("Calling StarDescQuery from HardRequestUpdate");
    StartDescQuery();
  }
}


function QBAPI_Execute(sCall, func_Callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', sCall, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = func_Callback;
  xhr.send("foo=bar&lorem=ipsum");
}



function ReturnFrame() {
  //Overwrite frame var based on interface setting determined from DOM
  var oElemLeft;
  var oElemRight;
  var oElemNewIE;
  var bFound = false;

  if (document.getElementsByClassName) {
    oElemLeft = document.getElementsByClassName("ui11 left item1 layout_button active");
    oElemRight = document.getElementsByClassName("ui11 right item2 layout_button active");
    oElemNewIE = document.getElementsByClassName("edge layout_button active");

    if (oElemLeft[0] != undefined) {
      if (oElemLeft[0].title.indexOf("vertical") > 0) bFound = true;
    }
    if (oElemLeft[1] != undefined) {
      if (oElemLeft[1].title.indexOf("vertical") > 0) bFound = true;
    }
    if (oElemRight[0] != undefined) {
      if (oElemRight[0].title.indexOf("horizontal") > 0) bFound = true;
    }
    if (oElemRight[1] != undefined) {
      if (oElemRight[1].title.indexOf("horizontal") > 0) bFound = true;
    }
    if (oElemNewIE[0] != undefined) {
      if (oElemNewIE[0].accessKey == "v") bFound = true;
    }
    if (oElemNewIE[1] != undefined) {
      if (oElemNewIE[1].accessKey == "v") bFound = true;
    }
  }

  if (bFound) {
    return "gsft_main_form";
  } else {
    return "gsft_main";
  }
}


// Button event to start script execution
function Run_Change() {
  if (gel("chkRun").checked) {
    if (sAccount == "") {
      AppendRunLog("Account is not set. If you are using NTTDS, make sure your domain is set properly and restart.");
      gel("chkRun").checked = false;
      CloseLoader();
      return;
    }
    if (bBombReturn) {
       UpdateWorkflowLog();
    } else {
      /*Kick off process*/
      sOrigQueueURL = MainWin.location.href;
      AppendRunLog("Original Queue Locked in --> " + sOrigQueueURL);
      switch (sAccount) {
        case "AMGEN": sDescField = "description"; break;
        case "AMITA": sDescField = "short_description"; break;
        case "Bombardier": sDescField = "short_description"; break;
        case "Caterpillar": sDescField = "short_description"; break;
        case "Cedars-Sinai": sDescField = "description"; break;
        case "Fifth Third Bank": sDescField = "description"; break;
        case "Grupo Bimbo": sDescField = "short_description"; break;
        case "Guardian": sDescField = "short_description"; break;
        case "Independent Health": sDescField = "description"; break;
        case "MedStar": sDescField = "description"; break;
        case "SunCoke Energy": sDescField = "description"; break;
        case "TxDOT": sDescField = "description"; break;
        case "US Bank":
          sDescField = "short_description";
                   break;
        default: sDescField = "description"; break;
      }
      AppendRunLog("Short Description Field: " + sDescField);
      AppendRunLog("Logged in User Name : " + MainWin.g_user.fullName);
      LoggedinUsername= MainWin.g_user.fullName;
      //Check the list of tickets in the ueue.
      CheckTable();
    }
  } else {
    CloseLoader();
  }
}


function SaveAndReturn() {
  /*This stuff should happen after last AJAX call completes for whatever*/
  AppendRunLog("Clicking Update button...");

  if (sAccount == "Vanderbilt") {
    btnUpdate = MainWin.document.getElementById("ctl00_ContentPlaceHolder1_butUpdate");
  } else {
    btnUpdate = MainWin.document.getElementById("sysverb_update");
  }
  if(!btnUpdate) btnUpdate = MainWin.document.getElementById("sysverb_update_and_stay");
  if (btnUpdate) {
    btnUpdate.click();
    //sleep(30000);
    AppendRunLog("btnUpdate.click() called");
  } else {
    AppendRunLog("btnUpdate evaluates as false");
  }

  VarReset();
sleep(3000);
  AppendRunLog("Recheck Time:3000");
  setTimeout(CheckTable, 3000);
}

/*This Function is for WEST */
function SaveAndStay() {
  /*This stuff should happen after last AJAX call completes for whatever*/
  AppendRunLog("Clicking Save button...");

  btnUpdate = MainWin.document.getElementById("sysverb_update_and_stay");

  btnUpdate.click();
  sleep(3000);
  AppendRunLog("Recheck Time:1000");
}



function SDContainsCode() { return sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " "; }

function SetupDispatchInterface() {
  var oDispWin = document.createElement("div");
  var oHeader = document.createElement("div");
  var oHeaderText = document.createElement("div");
  var oHeaderClose = document.createElement("div");
  var oHeaderCloseImg = document.createElement("img");
  var oRunInput = document.createElement("input");
  var oRunLabel = document.createElement("label");
  var oLogText = document.createElement("textarea");
  var sADWinLeft = localStorage.sADWinLeft;
  var sADWinTop = localStorage.sADWinTop;

  /*Recreate floating window if it exists*/
  if (gel("DispatchWindow")) {
    gel("DispatchWindow").parentNode.removeChild(gel("DispatchWindow"));
  }

  if (!sADWinLeft) sADWinLeft = "350px";
  if (!sADWinTop) sADWinTop = "160px";

  if (parseInt(sADWinLeft) < 0) sADWinLeft = "0px";
  if (parseInt(sADWinTop) < 0) sADWinTop = "0px";

  oDispWin.id = "DispatchWindow";
  oDispWin.className = "SNAPWin";
  oDispWin.style.cssText = "z-index:32767; left:" + sADWinLeft + "; top:" + sADWinTop + "; width:323px; height:375px;";
  oHeader.id = "DispatchHeader";
  oHeader.className = "SNAPWinTitle";
  oHeader.style.width = "321px";
  oHeaderText.className = "SNAPShadowText";
  oHeaderText.style.cssText = "position:absolute; top:0px; left:5px; color:white; cursor:grab;";
  oHeaderText.innerHTML = "WAM - v" + sAutoVer + " (" + sAccount + ")";
  oHeaderClose.id = "DispatchCloseBtn";
  oHeaderClose.className = "SNAPButton";
  oHeaderClose.style.cssText = "position:absolute; top:0px; left:301px; float:right;";
  oHeaderCloseImg.style.cssText = "width:18px; height:18px;";
  oHeaderCloseImg.border = 0;
  oHeaderCloseImg.src = sImagePath + "closebutton.png";
  oRunInput.id = "chkRun";
  oRunInput.setAttribute("type", "checkbox");
  oRunInput.className = "tgl tgl-flip";
  oRunLabel.setAttribute("for", "chkRun");
  oRunLabel.setAttribute("data-tg-off", "Run Dispatcher");
  oRunLabel.setAttribute("data-tg-on", "Dispatching...");
  oRunLabel.className = "tgl-btn";
  oRunLabel.style.cssText = "width:auto;";
  oLogText.id = "txtLog";
  oLogText.style.resize = "none";
  oLogText.style.width = "321px";
  oLogText.style.height = "328px";
  oLogText.style.background = "#DDE3EB";
  oLogText.style.color = "darkslategray";
  oLogText.readOnly = true;

  /*After a code analysis, it doesn't appear RFWP is ever used.
  //It might be best at some point to caption these buttons as simply "Step 1," "Step 2," etc.
  //PopHoneywell() is the only routine using nRFCF and nRFIN*/

  document.body.appendChild(oDispWin);
  oDispWin.appendChild(oHeader);
  oHeader.appendChild(oHeaderText);
  oHeader.appendChild(oHeaderClose);
  oHeaderClose.appendChild(oHeaderCloseImg);
  oDispWin.appendChild(oRunInput);
  oDispWin.appendChild(oRunLabel);
  oDispWin.appendChild(oLogText);
  document.body.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.padding = "0";

  oRunInput.onchange = Run_Change;
  oHeaderClose.onclick = CloseDispatchWindow;
  oHeader.onmousedown = function onMouseDown(event) { beginADWinDrag(this.parentNode, event); };
}

function ShowLoader() {
  var oLoader = document.createElement("div");
  var oStyle = document.createElement('style');
  var sCSS = "";
  oStyle.id = "LoadingCSS";
  oStyle.type = 'text/css';
  sCSS += "@-webkit-keyframes spin { " + "\n";
  sCSS += "  0% { -webkit-transform: rotate(0deg); }" + "\n";
  sCSS += "  100% { -webkit-transform: rotate(360deg); }" + "\n";
  sCSS += "}";
  sCSS += "";
  sCSS += "@keyframes spin {";
  sCSS += "  0% { transform: rotate(0deg); }" + "\n";
  sCSS += "  100% { transform: rotate(360deg); }" + "\n";
  sCSS += "}" + "\n";
  sCSS += "" + "\n";
  sCSS += ".animate-bottom {" + "\n";
  sCSS += "  position: relative;" + "\n";
  sCSS += "  -webkit-animation-name: animatebottom;" + "\n";
  sCSS += "  -webkit-animation-duration: 1s;" + "\n";
  sCSS += "  animation-name: animatebottom;" + "\n";
  sCSS += "  animation-duration: 1s" + "\n";
  sCSS += "}" + "\n";
  sCSS += "" + "\n";
  sCSS += "@-webkit-keyframes animatebottom {" + "\n";
  sCSS += "  from { bottom:-100px; opacity:0 } " + "\n";
  sCSS += "  to { bottom:0px; opacity:1 }" + "\n";
  sCSS += "}" + "\n";
  sCSS += "" + "\n";
  sCSS += "@keyframes animatebottom { " + "\n";
  sCSS += "  from{ bottom:-100px; opacity:0 } " + "\n";
  sCSS += "  to{ bottom:0; opacity:1 }" + "\n";
  sCSS += "}";
  oStyle.innerHTML = sCSS;

  oLoader.id = "loaderAnim";
  oLoader.style.cssText = "position: absolute; left: 50%; top: 50%; z-index: 1; width: 150px; height: 150px; margin: -75px 0 0 -75px; border: 16px solid #f3f3f3; border-radius: 50%; border-top: 16px solid #3498db; width: 120px; height: 120px; -webkit-animation: spin 2s linear infinite; animation: spin 2s linear infinite; cursor: wait;";
  document.getElementsByTagName('head')[0].appendChild(oStyle);
  document.body.appendChild(oLoader);
}



function StartDescQuery() {
  OutSys_CallAPI("GetRoleMatchMatrixByAccount_TicketType?AccountName=" + sAccount + "&TicketType=" + sNumber.slice(0, 3), "GET", StartGroupQuery, "StartDescQuery");
}



function StartGroupQuery() {
  /*Adjust role query part*/
  sOrigRoleQueryPart = sRoleQueryPart;
  AppendRunLog("Calling StartQuery once GetGroupMatchMatrixByAccount API completes.");
  OutSys_CallAPI("GetGroupMatchMatrixByAccount?AccountName=" + sAccount, "GET", StartQuery, "StartGroupQuery");
}

function StartQuery() {
  var url = "";
  var sPPMOverride = "false";
  var sPPMInEffect = "false";
  var sAvailableField = "";
  var sAssGroupDisplay = "";
  var sOrigGroupSearch = sGroupOverrideSearch; //Tenet

  /*Tenet vars*/
  var nFoundRow = -1;
  var sItem = "";
  var grItem = null;
  var sCurGroup = "";
  var sDescription = "";

  //sToolLogInfo="";

  AppendRunLog("Start of StartQuery...");
  AppendToolLog("Start of StartQuery...");
  
  /* BG Data to run the query without the ticketing tool instance */
  sCurGroup = "SN-NTT_FS_Depot";
  sDescription = "";
  /* BG Data to run the query without the ticketing tool instance */

  if (isTicketingToolEnv) {
    sCurGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
    sDescription = MainWin.g_form.getValue("description");;
  }

  if (sAccount == "Tenet") {
    switch (sNumber.substr(0, 3)) {
      case "INC":
        sGroupOverrideSearch = MainWin.g_form.getValue("u_issue_type") + "::" + sCurGroup;
        break;
      case "RIT":
        sGroupOverrideSearch = MainWin.g_form.getDisplayBox("cat_item").value + "::" + sCurGroup;
        break;
      case "SCT":
        sItem = MainWin.g_form.getReference("request_item").cat_item;
        grItem = new GlideRecord("sc_cat_item");
        grItem.get(sItem);
        sGroupOverrideSearch = sItem + "::" + MainWin.g_form.getDisplayBox("assignment_group").value;
        break;
    }
  }

  /*Adjust assignment group*/
  if (typeof (GroupMatchMatrixByAccountJSON) == 'undefined') {
    GroupMatchMatrixByAccountJSON = "";
  }
  AppendRunLog("sGroupOverrideSearch:" + sGroupOverrideSearch);
  for (var i = 0; i < GroupMatchMatrixByAccountJSON.length; i++) {
    if (GroupMatchMatrixByAccountJSON[i]['Search'] == sGroupOverrideSearch) {
      nFoundRow = i;
    }
  }

  if (sAccount == "Tenet" && nFoundRow == -1) {
    sGroupOverrideSearch = sOrigGroupSearch;
    for (var i = 0; i < GroupMatchMatrixByAccountJSON.length; i++) {
      if (GroupMatchMatrixByAccountJSON[i]['Search'] == sGroupOverrideSearch) {
        nFoundRow = i;
      }
    }
  }

  if (nFoundRow > -1) {
    sAssGroup = GroupMatchMatrixByAccountJSON[nFoundRow]['AssignmentGroupsName'];
    sSNGroupID = GroupMatchMatrixByAccountJSON[nFoundRow]['ServiceNowAssignmentGroupSysID'];
    sPPMOverride = GroupMatchMatrixByAccountJSON[nFoundRow]['IsPPMOverride'];
    sPPMInEffect = GroupMatchMatrixByAccountJSON[nFoundRow]['IsPPMInEffect'];
  }

  /*Account-specific assignment group override*/
  switch (sAccount) {
    case "AIG":
      if (sAssGroup.indexOf("Master") > -1) {
        sAssGroup = "GFS-Remote Sites-AMG, Corporate & Chart";
        sSNGroupID = "1c897ade0aaf38ae014c8dccdb220cce";
      }
      break;
    case "Tenet":
      AppendRunLog("LOOKUP????:" + sAssGroup);
      if (sAssGroup.indexOf("Lookup") > -1) {
        sAssGroupDisplay = MainWin.g_form.getDisplayBox("assignment_group").value;
        if (sAssGroupDisplay.indexOf("HOSP") > -1) {
          sAssGroup = sAssGroupDisplay + "-Staffed";
        }
      }
      break;
    case "US Bank":
      /*US Bank specific override*/
      if (sNumber.substr(0, 3) == "SCT") {
        sUserEmail = MainWin.g_form.getReference("request.requested_for").email;
        for (var i = 0; i < arrEmailAdds.length; i++) {
          if (sUserEmail == arrEmailAdds[i]) {
            //Disabled for now
            //if(sAssGroup == "FS_G1:RMI") sAssGroup = "FS_G1:RTO";
          }
        }
      }
      break;
    case "WEST":
      sAssGroupDisplay = MainWin.g_form.getDisplayBox("assignment_group").value;
      if (sAssGroupDisplay.indexOf("Staffed") > -1 || sAssGroupDisplay.indexOf("Local") > -1 || sAssGroupDisplay.indexOf("Remote") > -1) {
        sSNGroupID = MainWin.g_form.getValue("assignment_group");
        sAssGroup = sAssGroupDisplay;
      }
      break;
      case "Worley":
        sAssGroup =     MainWin.g_form.getDisplayBox("assignment_group").value;
break;
  }

  /*Pick appropriate field for availability*/
  if (sPPMOverride == "yes") {
    if (sPPMInEffect == "yes") {
      sAvailableField = "14"; //Technician - Available
    } else {
      sAvailableField = "96"; //OPPM - Available
    }
  } else {
    sAvailableField = "109"; //Available
  }

  AppendRunLog("sAssGroup = \"" + sAssGroup + "\"");
  AppendToolLog("sAssGroup = \"" + sAssGroup + "\"");
  TechnicianAssignmentByAccountJSON = "";
  OutSys_CallAPI("GetTechnicianAssignmentByAccountAndRoleGMM?AccountName=" + sAccount + "&AssignmentGroupName=" + sAssGroup + "&RoleName=" + sRoleQueryPart + "&AdjustedRole=" + (RoleMatchMatrixByAccountJSON == "" ? sRoleQueryPart : RoleMatchMatrixByAccountJSON[0]['RoleName']) + "&OriginalRole=" + sOrigRoleQueryPart + "&IsPPMOverride=" + sPPMOverride + "&IsPPMInEffect=" + sPPMInEffect, "GET", CheckTechs, "StartQuery");

}

function isValidJson(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

function OutSys_CallAPI(sURLPart, sCALL, func_callback, sCallingFunction) {
  var url = sNTTAPIURL + "rest/V2/" + sURLPart;
  var request = new XMLHttpRequest();
  var sResponseText = "";

  request.onreadystatechange = function () {
    if (this.readyState == 4) {
      if(this.status == 200) {
        sResponseText = this.responseText;
        window.eval(sResponseText);
        console.log(window.eval(sResponseText));
        AppendRunLog('sResponseText' + sResponseText);
        AppendRunLog(sURLPart + '-> Data found!');

        AppendToolLog('sResponseText' + sResponseText);
        AppendToolLog(sURLPart + '-> Data found!');
        //}
      } else {
        AppendRunLog("this.readyState:" + this.readyState);
        AppendRunLog("this.status:" + this.status);
        AppendRunLog(sURLPart + '-> Data not found!');

        AppendToolLog("this.readyState:" + this.readyState);
        AppendToolLog("this.status:" + this.status);
        AppendToolLog(sURLPart + '-> Data not found!');
      }
      func_callback();
    }
  }

  request.open(sCALL, url);
  request.setRequestHeader('AppId', AppID);
  request.setRequestHeader('ApiKey', APIKey);
  request.send();
};


function TicketSNErrors() {
  var sReturn = "";
  var arrErrors = MainWin.gel("output_messages").getElementsByClassName("outputmsg_text")
  if (arrErrors.length > 0) {
    sReturn += " The following errors were displayed on ticket form...\n";
    for (var i = 0; i < arrErrors.length; i++) {
      sReturn += arrErrors[i].innerHTML + "\n";
    }
  }
  return sReturn;
}



function TicketUpdateProcess() {
  CloseLoader();
   if (!bBombReturn) {
    SaveAndReturn();
  } else {
    AppendRunLog("Dispatching halted. Click 'Run Dispatcher' when ready to proceed.");
    gel("chkRun").click();
  }
}



function TriggerEvent(oEl, sEventName) {
  var eEvent = document.createEvent('HTMLEvents');
  eEvent.initEvent(sEventName, true, false);
  oEl.dispatchEvent(eEvent);
}



function TriggerErrorNotification(sError) {
  var sNotificationText = "";
  var sUpdateURL = "";
  var FIVE_MINS_MS = 300000;

  sNotificationText = "Workflow Manager may be presently halted or not dispatching correctly. Please check process condition and restart if necessary.\n";
  sNotificationText += "\nError Logged: " + sError;
  sNotificationText += "\n(Running Workflow Manager -v" + sAutoVer + ", Account:" + sAccount + ")";

  var PostUrl=  sNTTAPIURL+'rest/V2/PostErrorNotification/';

  var PostData=[{  
  
              "AccountName": ""+sAccount+"",
              "NotificationText": ""+sNotificationText+"",
              "EmailType": "WAM Error"
    }];   
  
    jQuery.ajax({
      url: PostUrl,
      type: 'POST',
      headers: {
            'AppId': AppID,
            'ApiKey': APIKey
          },
      data: JSON.stringify(PostData),
      //contentType: 'application/json; charset=utf-8',
      //dataType: 'json',
      success: TicketUpdateProcess,
      error: function(error) {
         AppendRunLog(error);
         TicketUpdateProcess();
      }
    });

      /*Log an error notification record in QB if it's the first error...
   * ...or it's been longer than 5 minutes since the last error*/
  dPreErrDate = new Date();
  if (nErrCount == 0 || dPreErrDate - dErrDate > FIVE_MINS_MS) jQuery.getScript(sUpdateURL);
  dErrDate = new Date();
  nErrCount++;
  }

function UpdateBlankPriorityFields() {
  if (sNumber.slice(0, 3) == "INC") {
    var sImpact = "";
    var sUrgency = "";

    sPriority = MainWin.g_form.getValue("priority");
    sUrgency = MainWin.g_form.getValue("urgency");
    sImpact = MainWin.g_form.getValue("impact");
    if (sUrgency == "") {
      AppendRunLog("Urgency is blank. Setting it to match priority.");
      MainWin.g_form.setValue("urgency", sPriority);
      MainWin.g_form.flash("urgency", "#00CC00", 0); //Flash
    }
    if (sImpact == "") {
      AppendRunLog("Impact is blank. Setting it to match priority.");
      MainWin.g_form.setValue("impact", sPriority);
      MainWin.g_form.flash("impact", "#00CC00", 0); //Flash
    }
  }
}

function UpdateWorkflowLog() {
  var dEndDate = new Date();
  var nCalcTOT = dEndDate - dCurDate;
  var sUpdateURL = "";
  var sTicketURL = "";
  var sLogType = "Workflow";
  var sCurAssGroup = "";
  var sCurAssTo = "";
  var CurAssignedTo = null;

  if (!bBombReturn) {
    AppendRunLog("bBombReturn false. Setting sLogType to 'Initial.");
    sLogType = "Initial";
  } else {
    if (!bAssGroupChange) {
      FieldComparison({ sNumber: sNumber }, "number");

      if (sNumber.slice(0, 3) == "INC") {
        FieldComparison({ sPriority: sPriority }, "priority");
      } else {
        if ((sShortDesc != "Update Inventory" && sShortDesc != "Uptade Inventory") && sItem != "Termination Request") {
          FieldComparison({ sPriority: sPriority }, "sc_task.u_sla_type_ritm");
        }
      }

      FieldComparison({ sLocation: sLocation }, "location");

      sCurAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
      if (sAssGroup != sCurAssGroup) {
        sAssGroup = sCurAssGroup;
        sUpdatedFieldList += "assignment_group;";
        bAssGroupChange = true;
        bBombReturn = false;
        AppendRunLog("Group on ticket doesn't match sAssGroup. Calling StartQuery from UpdateWorkflowLog.");
        AppendToolLog("Group on ticket doesn't match sAssGroup. Calling StartQuery from UpdateWorkflowLog.");
        StartQuery();
        return;
      }

      CurAssignedTo = MainWin.g_form.getReference("assigned_to");
      sCurAssTo = AssignedTo.first_name + " " + AssignedTo.last_name;
      if (sAssignedTo != sCurAssTo) {
        sAssignedTo = sCurAssTo;
        sUpdatedFieldList += "assigned_to";
      }
    }
  }

  bAssGroupChange = false;

  sTicketURL = window.location.href;
  sTicketURL = (sTicketURL.indexOf("%26") ? sTicketURL.substr(0, sTicketURL.indexOf("%26")) : sTicketURL);
  var PostUrl = sNTTAPIURL + 'rest/V2/PostWorkFlowLog/';

  /*Future Enhancement*/
   if(typeof(dSNLoadTime) == "undefined") { dSNLoadTime = MainWin.g_loadTime; }
  
  sLoadTime = dSNLoadTime.getUTCFullYear() + "-" + PadZero(dSNLoadTime.getUTCMonth()+1) + "-" + PadZero(dSNLoadTime.getUTCDate()) + " " + PadZero(dSNLoadTime.getUTCHours()) + ":" + PadZero(dSNLoadTime.getUTCMinutes()) + ":" + PadZero(dSNLoadTime.getUTCSeconds());
  
  var PostData = [{
    "TicketNumber": sNumber,
    "AssignmentGroupName": sAssGroup,
    "ActionCodeTemplateName": "DSPT",
    "FSTechnicianName": sAssignedTo,
    "FSTechnicianEmailId": sAssignedToEmail,
    "AccountName": sAccount,
    "LogTypeName": "Scheduling",
    "UnresolvedCodeName": "Printer",
    "AssignedTo": "" + sAssignedTo + "",
    "TicketTypeName": sNumber.substr(0,3),
    "LocationName": sLocation,
    "Priority": sPriority,
    "TOT": nCalcTOT,
    "PriorityOfTicket": sPriority,
    "TicketOpenedDateTime": sOpened,
    "TicketModifiedBy": sUserFullName,
    "TicketModifiedDateTime": dEndDate.toISOString().split("T")[0] + " " + dEndDate.toISOString().split("T")[1].split(".")[0],
    "Notes": sUpdateNotes,
    "TicketURL": sTicketURL,
    "ToolVersion": sAutoVer,
    "ActiveTicketCount": (TechnicianAssignmentByAccountJSON == "" ? 0 : TechnicianAssignmentByAccountJSON[0]['CurCount']),
    "TicketLoadDateTime": sLoadTime,
    "DispatchType": "HPL",
    "TicketLog": "" + sTicketLog + "",
    "ActionDateTime": dEndDate.toISOString().split("T")[0] + " " + dEndDate.toISOString().split("T")[1].split(".")[0],
    "IsAcknowledgmentUpdate": true,
    "LastActionStamp": "N/A [WAM]",
    "FieldsUpdated": sUpdatedFieldList,
    "ApplicationName": "WAM",
    "CreatedUser":"" + LoggedinUsername + "",
    "Log" : "NA"
  }];

  AppendRunLog("PostUrl:" + PostUrl);
  AppendRunLog("PostData:" + JSON.stringify(PostData));
  AppendToolLog("PostUrl:" + PostUrl);
  AppendToolLog("PostData:" + JSON.stringify(PostData));
  
  jQuery.ajax({
    url: PostUrl,
    type: 'POST',
    headers: {
      'AppId': AppID,
      'ApiKey': APIKey
    },
    data: JSON.stringify(PostData),
    success: TicketUpdateProcess,
    error: function (error) {
      AppendRunLog(error);
      AppendToolLog(error);
    }
  });
}

function USBCancelRun() {
  alert("Email addresses not loaded. Use 'Store Email Addresses' to load data into your browser's storage before running WAM.");
  gel("chkRun").checked = false;
  CloseLoader();
}

function VarReset() {
  /*Flag initial reset*/
  bReloadQueue = true;
  bBombReturn = false;

  /*Reset vars*/
  sRoleQueryPart = "";
  dCurDate = null;
  dPreErrDate = null;
  dErrDate = null;
  sHH = "";
  sMS = "";
  sDD = "";
  sYY = "";
  sMM = "";
  sZone = "";
  sCodeStamp = "";
  arrTicketLog = [[]];
  sPriority = "";
  sFirstName = "";
  sAssignedTo = "";
  sCreatedOn = "";
  sUserFullName = "";
  sProcessLog = "";
  sUpdateNotes = "";
  sShortDesc = "";
  sTicketLog = "";
  sUpdatedFieldList = "";
  sAssGroup = "";
  sSNGroupID = "";
  sGroupOverrideSearch = "";
  nErrCount = 0;
  AssignedTo = null;
  qdb_data = null;
  btnUpdate = null;

  AppendRunLog("Vars reset.");
}

function WorkflowAIG() {
  var sReqByPhone = "";
  var sReqForPhone = "";
  var elAdd = null;
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");

  dSNLoadTime = MainWin.g_loadTime;

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    MainWin.g_form.setValue("u_dell_action_code", sCodeStamp + " ADAC");
    MainWin.g_form.flash("u_dell_action_code", "#00CC00", 0); //Flash
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
  } else {
    MainWin.g_form.setValue("u_dell_ticket_code", sCodeStamp + " ADAC");
    MainWin.g_form.flash("u_dell_ticket_code", "#00CC00", 0); //Flash
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    elAdd = MainWin.gel(FindVariableID4Text("Additional description or information"));
    if (elAdd) {
      if (elAdd.value == "") {
        elAdd.value = "N/A";
      }
    }
    if (MainWin.g_form.getValue("u_department_cbd") == "") {
      MainWin.g_form.setValue("u_department_cbd", MainWin.g_form.getReference("u_requested_for").department);
    }
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowAMGEN() {
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  //Update short description
  if (SDContainsCode()) {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Auto-dispatched to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Calling to confirm tech availability for " + AssignedTo.fullName);
      MainWin.g_form.setValue("assigned_to", MainWin.g_user.getUserID());
      sAssignedTo = MainWin.g_user.fullName;
      MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
  } else {
    sPriority = MainWin.g_form.getValue("sc_task.u_sla_type_ritm");
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowAMITA() {
  //Account disabled

}

function WorkflowBomb() {
  var sItem;
  var sRSLVStamp;
  var sUSDGroup;

  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sAssignedTo = AssignedTo.name;
  sFirstName = AssignedTo.first_name;
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;
  sLocation = MainWin.g_form.getValue("location");
  sShortDesc = sShortDesc.replace(" ADAC", "");

  if (sNumber.slice(0, 3) == "INC") {
    MainWin.g_form.setValue("u_ntt_status_code", sCodeStamp + " ADAC");
    MainWin.g_form.flash("u_ntt_status_code", "#00CC00", 0); //Flash    
    sPriority = MainWin.g_form.getValue("priority");
    if (parseInt(sPriority) > 2 && parseInt(sPriority) < 10) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Auto-dispatched to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Calling to confirm tech availability for " + AssignedTo.fullName);
      MainWin.g_form.setValue("assigned_to", MainWin.g_user.getUserID());
      sAssignedTo = MainWin.g_user.fullName;
      MainWin.g_form.setValue("incident_state", "12"); //Correlates with "Acknowledged"
      MainWin.g_form.flash("incident_state", "#00CC00", 0); //Flash
    }
  } else {
    sItem = MainWin.g_form.getValue("request_item.cat_item_label");
    sRSLVStamp = sCodeStamp.replace("DSPT", "RSLV");
    sUSDGroup = MainWin.g_form.getValue("assignment_group.u_usd_name");

    if (SDContainsCode()) sShortDesc = sShortDesc.substr(24);

    if ((sShortDesc == "Update Inventory" || sShortDesc == "Uptade Inventory") && sItem == "Termination Request") {
      MainWin.g_form.setValue("work_notes", sRSLVStamp + "\nWork completed by FS as part of the Receive ticket.");
      MainWin.g_form.setValue("state", "3"); //Closed Complete
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
      MainWin.g_form.setValue("short_description", sRSLVStamp + " - " + sShortDesc);
      MainWin.g_form.flash("short_description", "#00CC00", 0); //Flash
      if (sUSDGroup.substr(0, 3) == "CAN") {
        if (sUSDGroup.indexOf("Downsview") > -1) {
          MainWin.g_form.setValue("assignment_group", "032bc7d76fa99e88a6bd9b9eae3ee41a"); //FS Project Toronto - Canada
        } else {
          MainWin.g_form.setValue("assignment_group", "b4bb7e346f470e00d6a2f35d5d3ee4ca"); //FS Project Montreal - Canada
        }
        MainWin.g_form.flash("assignment_group", "#00CC00", 0); //Flash
      }
    } else {
      MainWin.g_form.setValue("short_description", sCodeStamp + " ADAC - " + sShortDesc);
      MainWin.g_form.flash("short_description", "#00CC00", 0); //Flash
      sPriority = MainWin.g_form.getValue("sc_task.u_sla_type_ritm");
      if (sShortDesc.indexOf("Voice plan only") > -1) {
        MainWin.g_form.setValue("assignment_group", "bac217866ff24a00d6a2f35d5d3ee488"); //Mobile Device Management
        MainWin.g_form.flash("assignment_group", "#00CC00", 0); //Flash
      }

      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    }
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}


function WorkflowBanamex() {
  var sReqByPhone = "";
  var sReqForPhone = "";
  var sSymptom = "";
  var elAdd = null;
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  if (sNumber.slice(0, 3) == "INC") {
    sShortDesc = MainWin.g_form.getValue("u_user_defined_1");

  } else {

  }

  sOpened = MainWin.g_form.getValue("opened_at");

  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  if (sNumber.slice(0, 3) == "INC") {
    sShortDesc = sShortDesc.replace(" ADAC", "");
    if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
      MainWin.g_form.setValue("u_user_defined_1", sCodeStamp + " ADAC\n\n" + sShortDesc.substr(23));
    } else {
      MainWin.g_form.setValue("u_user_defined_1", sCodeStamp + " ADAC\n\n" + sShortDesc);
    }
    MainWin.g_form.flash("u_user_defined_1", "#00CC00", 0); //Flash
  } else {

  }


  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    sSymptom = MainWin.g_form.getValue("incident.u_symptom");

    if (sSymptom == "") {
      MainWin.g_form.setValue("incident.u_symptom", "?");
    }

    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.gel("in_progress_id").click();
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    elAdd = MainWin.gel(FindVariableID4Text("Additional description or information"));
    if (elAdd) {
      if (elAdd.value == "") {
        elAdd.value = "N/A";
      }
    }
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}


function WorkflowCAT() {
  var TOT = 0;
  var grUser;

  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;


  sShortDesc = MainWin.g_form.getValue("short_description");
  sShortDesc = sShortDesc.replace(" ADAC", "");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  //Update short description
  if (SDContainsCode()) {
    TOT = parseFloat(sShortDesc.substr(23, 3)) || 0;
    TOT = TOT + 2;
    //Reformat TOT with leading 0s
    TOT = String("00" + TOT);
    TOT = TOT.substr(TOT.length - 3);
    MainWin.g_form.setValue("short_description", sCodeStamp + " (" + TOT + ") ADAC - " + sShortDesc.substr(28));
  } else {
    MainWin.g_form.setValue("short_description", sCodeStamp + " (002) ADAC - " + sShortDesc);
  }
  MainWin.g_form.flash("short_description", "#00CC00", 0); //Flash


  if (sNumber.slice(0, 3) == "INC") {
    grUser = MainWin.g_form.getReference("caller_id");
    sLocation = String(grUser.u_desk_location).substr(0, 2);
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Auto-dispatched to " + sFirstName + ".");
  } else {
    grUser = MainWin.g_form.getReference("request_item.request.requested_for");
    sLocation = String(grUser.u_desk_location).substr(0, 2);
    sPriority = MainWin.g_form.getValue("sc_task.u_sla_type_ritm");
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Auto-dispatched to Scheduler.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowCorteva(bHardQuery) {
  var strDescBuffer = "";
  var strADAC = " ADAC";
  var fortnightAway = new Date(Date.now() + 12096e5);
  var NewDate = "";
  NewDate = SetTwoWeeks(fortnightAway);

  AppendRunLog("New Pending date: " + NewDate);
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  /*Update Description*/
  if (sShortDesc.charAt(2) == "/" && sShortDesc.charAt(5) == "/") {
    strDescBuffer = sShortDesc.substr(22); //Ignore existing status code
    if (strDescBuffer.substr(0, 4) == "ADAC") {
      strDescBuffer = strDescBuffer.substr(5); //Bypass ADAC code
    }
  } else {
    strDescBuffer = sShortDesc;
  }
  MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n" + strDescBuffer);
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    MainWin.g_form.setValue("incident_state", "-3"); //Correlates with "In Progress"
    MainWin.g_form.flash("incident_state", "#00CC00", 0); //Flash
    AppendRunLog("Incident ticket updated notes and state.");
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    if (MainWin.g_form.getValue("sc_task.u_pending_end_date_time") == "") {
      MainWin.g_form.setValue("sc_task.u_pending_end_date_time", NewDate);
    }
    MainWin.g_form.flash("sc_task.u_pending_end_date_time", "#00CC00", 0); //Flash
    if (!bHardQuery) MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowCSMC() {
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("Assigned Set.");
  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;
  sShortDesc = MainWin.g_form.getValue("description");

  //Update short description
  if (SDContainsCode()) {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc.substr(27));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc.substr(4));
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash


  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Auto-dispatched to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Calling to confirm tech availability for " + AssignedTo.fullName);
      MainWin.g_form.setValue("assigned_to", MainWin.g_user.getUserID());
      sAssignedTo = MainWin.g_user.fullName;
      return;
    }
  } else {
    sPriority = MainWin.g_form.getValue("sc_task.u_sla_type_ritm");
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowFifthThird(bHardQuery) {
  var strDescBuffer = "";
  var strADAC = " ADAC";
  var fortnightAway = new Date(Date.now() + 12096e5);
  var NewDate = "";

  NewDate = SetTwoWeeks(fortnightAway);

  AppendRunLog("New Pending date: " + NewDate);
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sAssignedToEmail = AssignedTo.email;
  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  /*Update Description*/
  if (sShortDesc.charAt(2) == "/" && sShortDesc.charAt(5) == "/") {
    strDescBuffer = sShortDesc.substr(22); //Ignore existing status code
    if (strDescBuffer.substr(0, 4) == "ADAC") {
      strDescBuffer = strDescBuffer.substr(5); //Bypass ADAC code
    }
  } else {
    strDescBuffer = sShortDesc;
  }
  MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n" + strDescBuffer);
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    MainWin.g_form.setValue("incident_state", "-3"); //Correlates with "In Progress"
    MainWin.g_form.flash("incident_state", "#00CC00", 0); //Flash
    AppendRunLog("Incident ticket updated notes and state.");
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    if (MainWin.g_form.getValue("sc_task.u_pending_end_date_time") == "") {
      MainWin.g_form.setValue("sc_task.u_pending_end_date_time", NewDate);
    }
    MainWin.g_form.flash("sc_task.u_pending_end_date_time", "#00CC00", 0); //Flash
    if (!bHardQuery) MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowGB() {
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("Assigned Set.");
  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sShortDesc = MainWin.g_form.getValue("short_description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  //Update short description
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (SDContainsCode()) {
    MainWin.g_form.setValue("short_description", sCodeStamp + " ADAC - " + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("short_description", sCodeStamp + " ADAC - " + sShortDesc);
  }
  MainWin.g_form.flash("short_description", "#00CC00", 0); //Flash
  AppendRunLog("Short Description updated.");

  if (sNumber.slice(0, 3) == "INC") {
    AppendRunLog("Incident ticket updating.");
    sPriority = MainWin.g_form.getValue("priority");
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
    }
   } else {
    AppendRunLog("Non-incident ticket updating.");
    sPriority = MainWin.g_form.getValue("sc_task.u_sla_type_ritm");
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    //sCallerName = MainWin.g_form.getValue("sc_task.request_item.request.requested_for_label");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowGuardian() {
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("Assigned Set.");
  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  /*Update action code field*/
  MainWin.g_form.setValue("u_dell_status_code", sCodeStamp + " ADAC");
  MainWin.g_form.flash("u_dell_status_code", "#00CC00", 0); //Flash

  /*Update state*/
  MainWin.g_form.setValue("state", "1");
  MainWin.g_form.flash("state", "#00CC00", 0); //Flash

  /*Update TOT*/
  MainWin.g_form.setValue("u_tot_code", "0.03");
  MainWin.g_form.flash("u_tot_code", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    AppendRunLog("Incident ticket updating.");
    sPriority = MainWin.g_form.getValue("priority");
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.setValue("state", "9"); //Correlates with "In Progress"
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
  } else {
    AppendRunLog("Non-incident ticket updating.");
    sPriority = MainWin.g_form.getValue("sc_task.u_sla_type_ritm");
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowMagellan() {
  var sReqByPhone = "";
  var sReqForPhone = "";
  var sSymptom = "";
  var elAdd = null;
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getElement("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");

  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " (000) ADAC\n\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " (000) ADAC\n\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    if (MainWin.g_form.getValue("business_service") == "") {
      MainWin.g_form.setValue("business_service", "223215591b942810be13a687bd4bcb72");
    }
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
  } else {
    if (MainWin.g_form.getValue(GetVarID("Level of access granted / AD groups / Same As")) == "") {
      MainWin.g_form.setValue(GetVarID("Level of access granted / AD groups / Same As"), "N/A");
    }
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");

    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash

}

function WorkflowNovelis(sAssignID) {
  var sReqByPhone = "";
  var sReqForPhone = "";
  var sSymptom = "";
  var elAdd = null;
  AppendRunLog("Updating ticket...");
  AppendRunLog("sAssignID:" + sAssignID);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", sAssignID);

  AssignedTo = MainWin.g_form.getElement("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");

  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " (000) ADAC\n\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " (000) ADAC\n\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    if (MainWin.g_form.getValue("business_service") == "") {
      MainWin.g_form.setValue("business_service", "223215591b942810be13a687bd4bcb72");
    }
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
  } else {
    if (MainWin.g_form.getValue(GetVarID("Level of access granted / AD groups / Same As")) == "") {
      MainWin.g_form.setValue(GetVarID("Level of access granted / AD groups / Same As"), "N/A");
    }
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");

    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash

}


function WorkflowIHA() {
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " (000) ADAC\n\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " (000) ADAC\n\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.setValue("incident_state", "-3"); //Correlates with "In Progress"
      MainWin.g_form.flash("incident_state", "#00CC00", 0); //Flash
    }
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    MainWin.g_form.setValue("u_target_date", "20" + sYY + "-" + sMM + "-" + sDD);
    MainWin.g_form.flash("u_target_date", "#00CC00", 0); //Flash
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}


function WorkflowMedStar() {
  var strDescBuffer = "";
  var strADAC = " ADAC";
  var sCategory = "";
  var sSubCategory = "";

  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);


  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sAssignedToEmail = AssignedTo.email;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;
  sCategory = MainWin.g_form.getValue("category");
  sSubCategory = MainWin.g_form.getValue("subcategory");
  /*Update Description*/
  if (sShortDesc.charAt(2) == "/" && sShortDesc.charAt(5) == "/") {
    strDescBuffer = sShortDesc.substr(22); //Ignore existing status code
    if (strDescBuffer.substr(0, 4) == "ADAC") {
      strDescBuffer = strDescBuffer.substr(5); //Bypass ADAC code
    }
  } else {
    strDescBuffer = sShortDesc;
  }
  MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n" + strDescBuffer);
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash


  if (sNumber.slice(0, 3) == "INC") {
    if (sCategory == "") {
      MainWin.g_form.setValue("category", "Functionality");
      MainWin.g_form.setValue("subcategory", "Does Not Work");
      AppendRunLog("Category is blank");
      MainWin.g_form.flash("category", "#00CC00", 0); //Flash
      MainWin.g_form.flash("subcategory", "#00CC00", 0); //Flash
    }
    sPriority = MainWin.g_form.getValue("priority");
    sMedstarWorkNote = sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".";
    MainWin.g_form.setValue("work_notes", sMedstarWorkNote);
    AppendRunLog("Incident ticket updated notes and state.");
  } else {
    sMedstarWorkNote = sCodeStamp + "\n- Assigned to Technician.";
    MainWin.g_form.setValue("work_notes", sMedstarWorkNote);
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowPeg() {
  var TOT;

  AppendRunLog("WorkflowPeg() start");

  if (typeof MainWin.gel !== 'function') { MainWin.gel = function (sInput) { return MainWin.document.getElementById(sInput); }; }

  MainWin.gel('ctl00_ContentPlaceHolder1_txtAP').value = TechnicianAssignmentByAccountJSON[0]['Sys_ID'];
  TriggerEvent(MainWin.gel('ctl00_ContentPlaceHolder1_txtAP'), "change");

  //Attempts to send to Dell Status Code field if it exists
  if (MainWin.gel('ctl00_ContentPlaceHolder1_txtSupportStatusCode')) {
    MainWin.gel('ctl00_ContentPlaceHolder1_txtSupportStatusCode').value = sCodeStamp + " ADAC";
    sFirstName = MainWin.gel('ctl00_ContentPlaceHolder1_txtAP').value;
  }
  if (MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_txtSupportStatusCode')) {
    MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_txtSupportStatusCode').value = sCodeStamp + " ADAC";
    sFirstName = GetFNReq(); //Get first name from Request ticket dropdown
  }

  if (MainWin.gel('ctl00_ContentPlaceHolder1_lblID')) {
    sNumber = MainWin.gel('ctl00_ContentPlaceHolder1_lblID').innerHTML;
    arrTicketLog.push(sNumber);
    sPriority = MainWin.gel('ctl00_ContentPlaceHolder1_tcIncident_tpDetail_ddlPriority').value;

    if (parseInt(sPriority) > 2) {
      MainWin.gel('ctl00_ContentPlaceHolder1_txtUpdate').value = sCodeStamp + "\n- Auto-dispatched to " + sFirstName + ".";
      MainWin.gel('ctl00_ContentPlaceHolder1_ddlStatus').value = 2;
    } else {
      MainWin.gel('ctl00_ContentPlaceHolder1_txtUpdate').value = sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Pegasus.\n- Making Active." + sFirstName + " Tech is contacting the EU\n- Assigned to " + sFirstName + ".";
      MainWin.gel('ctl00_ContentPlaceHolder1_ddlStatus').value = 4; //Work In Progress
    }
    TOT = parseInt(MainWin.gel('ctl00_ContentPlaceHolder1_txtTimeOnTask').value) || 0;
    MainWin.gel('ctl00_ContentPlaceHolder1_txtTimeOnTask').value = TOT + 2;
  } else {
    //Requests
    MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpJournal_txtJournalUpdate').value = sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Pegasus.\n- Making Active." + sFirstName + " Tech is contacting the EU\n- Assigned to " + sFirstName + ".";
    TOT = parseInt(MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_txtTimeOnTask').value) || 0;
    MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_txtTimeOnTask').value = TOT + 2;
    switch (gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_lblFormName').innerHTML) {
      case "All AWS - INSTALL PC":
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 4;
        break;
      case "ALL AWS - INSTALL PRINTER":
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 4;
        break;
      case "ALL AWS - PURCHASE COMPUTER MONITOR OR DOCKING STATION":
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 4;
        break;
      case "ALL AWS - REFRESH":
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 4;
        break;
      case "ALL CWS - INSTALL PC":
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 4;
        break;
      case "ALL CWS - INSTALL PRINTER":
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 4;
        break;
      case "ALL CWS AND AWS - MOVE":
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 4;
        break;
      default:
        MainWin.gel('ctl00_ContentPlaceHolder1_tcRequest_tpDetail_ddlStatus').value = 2;
        break;
    }
  }

  AppendRunLog("WorkflowPeg() end");
}


function WorkflowSuncoke() {
  var FirstName;

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  FirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowTenet() {
  var FirstName;
  var sCategory = "";
  var sSubCategory = "";
  var sIssueType = "";
  var nLOOPTIMEOUT_MS = 30000;
  var nLOOPCHECK_MS = 250;

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  FirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " NTTDATATOOLWAM  ADAC\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " NTTDATATOOLWAM  ADAC\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    MainWin.g_form.setValue("work_notes", sCodeStamp + " NTTDATATOOLWAM\n- Assigned to " + FirstName + ".");
    MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
    MainWin.g_form.setValue("state", "2"); //"In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash

    sCategory = MainWin.g_form.getValue("category");
    sSubCategory = MainWin.g_form.getValue("subcategory");
    sIssueType = MainWin.g_form.getValue("u_issue_type");

    if (MainWin.g_form.getValue("u_service_support_phone") == "") {
      MainWin.g_form.setValue("u_service_support_phone", "NA");
    }
    if (MainWin.g_form.getValue("u_service_support_email") == "") {
      MainWin.g_form.setValue("u_service_support_email", "NA");
    }

    if (sIssueType == "") {
      switch (sCategory) {
        case "Printer": MainWin.g_form.setValue("u_issue_type", "User Hardware"); break;
        case "Network": MainWin.g_form.setValue("u_issue_type", "User Software"); break;
        case "Operations": MainWin.g_form.setValue("u_issue_type", "User Software"); break;
        case "Workstation (Desktop/Laptop)": MainWin.g_form.setValue("u_issue_type", "User Hardware"); break;
        case "Voice/Telecom": MainWin.g_form.setValue("u_issue_type", "User Hardware"); break;
        default: MainWin.g_form.setValue("u_issue_type", "User Software"); break;
      }
      MainWin.g_form.flash("u_issue_type", "#00CC00", 0); //Flash    
    }

    if (sCategory == "") {
      AppendRunLog("Category is blank. Setting it to Workstation.");
      MainWin.g_form.setValue("category", "Workstation (Desktop/Laptop)");
      MainWin.g_form.flash("category", "#00CC00", 0); //Flash

      AppendRunLog("Setting subcategory to [Blank].");
      MainWin.g_form.setValue("subcategory", "[Blank]");

      AppendRunLog("Initiating LoopCheckCondition loop.");
      LoopCheckCondition(function () {
        var sCategory = MainWin.g_form.getValue("category");
        var sSubCat = MainWin.g_form.getValue("subcategory");
        AppendRunLog("sCategory/sSubCat check. (sCategory:" + sCategory + ",sSubCat:" + sSubCat + ")");
        return (sCategory != "" && sSubCat != "[Blank]");
      }, function () {
        var sCategory = MainWin.g_form.getValue("category");
        var sSubCat = MainWin.g_form.getValue("subcategory");
        switch (sCategory) {
          case "Application/Software": MainWin.g_form.setValue("subcategory", "Operations"); break;
          case "Printer": MainWin.g_form.setValue("subcategory", "Multi-Function/Scanner/Printer/Fax"); break;
          case "Network": MainWin.g_form.setValue("subcategory", "Internet Connectivity"); break;
          case "Workstation (Desktop/Laptop)": MainWin.g_form.setValue("subcategory", "Desktop"); break;
          case "Voice/Telecom": MainWin.g_form.setValue("subcategory", "ACD"); break;
          default:
            AppendRunLog("Subcategory is blank, but Category is not matched. Category:" + sCategory);
            return;
      
        }
        MainWin.g_form.flash("sub_category", "#00CC00", 0); //Flash

        AppendRunLog("Ticket data set. Updating workflow log...");
        UpdateWorkflowLog();
      }, nLOOPTIMEOUT_MS, nLOOPCHECK_MS);
    } else {
      AppendRunLog("Category is non-blank. Immediately setting subcategory.");
      sSubCategory = MainWin.g_form.getValue("subcategory");
      if (sSubCategory == "") {
        switch (sCategory) {
          case "Application/Software": MainWin.g_form.setValue("subcategory", "Operations"); break;
          case "Printer": MainWin.g_form.setValue("subcategory", "Multi-Function/Scanner/Printer/Fax"); break;
          case "Network": MainWin.g_form.setValue("subcategory", "Internet Connectivity"); break;
          case "Workstation (Desktop/Laptop)": MainWin.g_form.setValue("subcategory", "Desktop"); break;
          case "Voice/Telecom": MainWin.g_form.setValue("subcategory", "ACD"); break;
          default:
            AppendRunLog("Subcategory is blank, but Category is not matched. Category:" + sCategory);
            return;
 
        }
      }

      AppendRunLog("Ticket data set. Updating workflow log...");
      UpdateWorkflowLog();
    }
  } else {
    sPriority = MainWin.g_form.getValue("sc_task.u_sla_type_ritm");
    MainWin.g_form.setValue("work_notes", sCodeStamp + " NTTDATATOOLWAM\n- Assigned to Technician.");
    MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
    MainWin.g_form.setValue("state", "2"); //"Work in Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash

    AppendRunLog("Ticket data set. Updating workflow log...");
    UpdateWorkflowLog();
  }

}

function WorkflowTollBrothers() {
  //Modified by sanjay on 10-Jun-2022 - Start  
  if (isTicketingToolEnv) {
    var FirstName;

    MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['SysID']);

    AssignedTo = MainWin.g_form.getReference("assigned_to");
    FirstName = AssignedTo.first_name;
    sAssignedTo = AssignedTo.name;

    sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
    sNumber = MainWin.g_form.getValue("number");
    sShortDesc = MainWin.g_form.getValue("short_description");
    sOpened = MainWin.g_form.getValue("opened_at");
    dSNLoadTime = MainWin.g_loadTime;

    /*Update short description*/
    sShortDesc = sShortDesc.replace(" ADAC", "");
    if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
      MainWin.g_form.setValue("short_description", sCodeStamp + " ADAC\n" + sShortDesc.substr(23));
    } else {
      MainWin.g_form.setValue("short_description", sCodeStamp + " ADAC\n" + sShortDesc);
    }
    MainWin.g_form.flash("short_description", "#00CC00", 0); //Flash

    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash  
  }
  //Modified by sanjay on 10-Jun-2022 - End
}

function WorkflowTxDOT() {
  var sReqByPhone = "";
  var sReqForPhone = "";
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");

  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sReqByPhone = MainWin.g_form.getValue("u_req_by_phone");
    sReqForPhone = MainWin.g_form.getValue("u_req_for_phone");
    sPriority = MainWin.g_form.getValue("priority");

    if (sReqByPhone == "") {
      MainWin.g_form.setValue("u_req_by_phone", "123");
      MainWin.g_form.flash("u_req_by_phone", "#00CC00", 0);
    }
    if (sReqForPhone == "") {
      MainWin.g_form.setValue("u_req_for_phone", "123");
      MainWin.g_form.flash("u_req_by_phone", "#00CC00", 0);
    }

    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.setValue("incident_state", "-3"); //Correlates with "In Progress"
      MainWin.g_form.flash("incident_state", "#00CC00", 0); //Flash
    }
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    MainWin.g_form.setValue("u_target_date", "20" + sYY + "-" + sMM + "-" + sDD);
    MainWin.g_form.flash("u_target_date", "#00CC00", 0); //Flash
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowTxDOTNow() {
  var sReqByPhone = "";
  var sReqForPhone = "";
  var sSymptom = "";
  var elAdd = null;
  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");

  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    sSymptom = MainWin.g_form.getValue("incident.u_symptom");

    if (sSymptom == "") {
      MainWin.g_form.setValue("incident.u_symptom", "?");
    }

    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
    MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    elAdd = MainWin.gel(FindVariableID4Text("Additional description or information"));
    if (elAdd) {
      if (elAdd.value == "") {
        elAdd.value = "N/A";
      }
    }
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function WorkflowUSBSVC() {
  var Group = MainWin.g_form.getDisplayBox("assignment_group").value

  if (sNumber.slice(0, 3) == "INC" && Group.slice(0, 3) == ("Svc") && Group.endsWith("RRT") == false) {

    AcceptTicket();
    setTimeout("", 5000);

    AppendRunLog("Svc Assignment. Pressing accept");

    return true;
  } else {
    return false;
  }
}

function WorkflowUSBank() {
  var elAdd = null;
  var btnUpdate;
  var i;
  var sCategory = "";

  AppendRunLog("Updating ticket...");
  AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  AppendRunLog("MainWin:" + String(MainWin));
  AppendRunLog("MainWin.g_form:" + String(MainWin.g_form));
  sPriority = MainWin.g_form.getValue("priority");
  if (parseInt(sPriority) < 3) {
    MainWin.g_form.setValue("assigned_to", "36918305dbd21854545384a913961995");
  } else {
    MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
  }

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  sFirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");

  dSNLoadTime = MainWin.g_loadTime;

  sCategory = MainWin.g_form.getValue("category");


  if (sCategory == "") {
    MainWin.g_form.setValue("incident.category", "hardware");
    MainWin.g_form.setValue("incident.subcategory", "server");
    AppendRunLog("Category is blank");
    MainWin.g_form.flash("incident.category", "#00CC00", 0); //Flash
    MainWin.g_form.flash("incident.subcategory", "#00CC00", 0); //Flash
  }

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {

    btnUpdate = MainWin.document.getElementById("accept");

    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + sFirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + sFirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + sFirstName + " is contacting the EU\n- Assigned to " + sFirstName + ".");
      MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"
      MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    }
    if (btnUpdate) {
      AppendRunLog("Accept button found...Clicking it...");
      MainWin.document.getElementById("accept").click();
      setTimeout("", 5000);
    }
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");

    MainWin.g_form.setValue("state", "2"); //Correlates with "In Progress"

    MainWin.g_form.flash("state", "#00CC00", 0); //Flash
    elAdd = MainWin.gel(FindVariableID4Text("Additional description or information"));
    if (elAdd) {
      if (elAdd.value == "") {
        elAdd.value = "N/A";
      }
    }
    AppendRunLog("Catalog Task ticket updated notes and state.");
  }
  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash
}

function SendValue(sFieldName, sValue) {
  var sGREEN = "#00C00";
  var sREADONLY_PREFIX = "sys_readonly.";
  var sSELECTTAG = "SELECT";

  if (MainWin.g_form.getControl(sFieldName)) {
    if (MainWin.gel(sREADONLY_PREFIX + MainWin.g_form.getControl(sFieldName).id)) {
      AbortField(sFieldName);
      return;
    } else {
      MainWin.g_form.setValue(sFieldName, sValue);
      MainWin.g_form.flash(sFieldName, sGREEN, 0); //Flash
    }
  } else {
    console.log("SendValue cannot find field:" + sFieldName);
  }
}
//added 4/1/2021 from dignity
function AbortField(sFieldName) {
  var sErrMsg = "DWS Utility Error: This field appears to be read-only or the given option for a dropdown field is not available.";
  var sMsgType = "error";
  var bScroll = true;

  nAbortedFields++;
  MainWin.g_form.showFieldMsg(sFieldName, sErrMsg, sMsgType, bScroll);
  if (nAbortedFields == 1) sUpdateNotes += "\n\n";
  sUpdateNotes += "Failed to update " + sFieldName;
}

function WorkflowWEST() {
  var FirstName;
  var sSchedDesc = "";
  var btnUpdate;

  MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);

  AssignedTo = MainWin.g_form.getReference("assigned_to");
  FirstName = AssignedTo.first_name;
  sAssignedTo = AssignedTo.name;

  sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;
  sNumber = MainWin.g_form.getValue("number");
  sShortDesc = MainWin.g_form.getValue("description");
  sOpened = MainWin.g_form.getValue("opened_at");
  dSNLoadTime = MainWin.g_loadTime;

  /*Update short description*/
  sShortDesc = sShortDesc.replace(" ADAC", "");
  if (sShortDesc.substr(2, 1) == "/" && sShortDesc.substr(5, 1) == "/" && sShortDesc.substr(8, 1) == " " && sShortDesc.substr(13, 1) == " ") {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n" + sShortDesc.substr(23));
  } else {
    MainWin.g_form.setValue("description", sCodeStamp + " ADAC\n" + sShortDesc);
  }
  MainWin.g_form.flash("description", "#00CC00", 0); //Flash

  if (sNumber.slice(0, 3) == "INC") {
    sPriority = MainWin.g_form.getValue("priority");
    if (parseInt(sPriority) > 2) {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + FirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Assigned to " + FirstName + ".");
    } else {
      MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Verified " + FirstName + "\'s Schedule in OutSystems.\n- Verified workload in Service-Now.\n- Making Active.\n- " + FirstName + " is contacting the EU\n- Assigned to " + FirstName + ".");
      MainWin.g_form.setValue("incident_state", "9"); //Correlates with "In Progress"
      MainWin.g_form.flash("incident_state", "#00CC00", 0); //Flash
    }
  } else {
    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician.");
  }

  MainWin.g_form.flash("work_notes", "#00CC00", 0); //Flash

  sSchedDesc = MainWin.g_form.getValue("short_description");

}

function WorkflowWorley() {
 
  if (isTicketingToolEnv) {
    var FirstName;

    AppendRunLog("TechnicianAssignmentByAccountJSON[0]['Sys_ID']:" + TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
 
    MainWin.g_form.flash("assignment_group", "#00CC00", 0); //Flash
    MainWin.g_form.setValue("assigned_to", TechnicianAssignmentByAccountJSON[0]['Sys_ID']);
    MainWin.g_form.flash("assigned_to", "#00CC00", 0); //Flash
   
    AssignedTo = MainWin.g_form.getReference("assigned_to");
    FirstName = AssignedTo.first_name;
    sAssignedTo = AssignedTo.name;
    sAssignedToEmail = AssignedTo.email;

    sAssGroup = MainWin.g_form.getDisplayBox("assignment_group").value;

    AppendRunLog("Assignment Group:" + sAssGroup);

    sNumber = MainWin.g_form.getValue("number");

    sOpened = MainWin.g_form.getValue("opened_at");

    dSNLoadTime = MainWin.g_loadTime;
    
    MainWin.g_form.setValue("state", "2");

    MainWin.g_form.setValue("u_my_work_priority", sCodeStamp );

     MainWin.g_form.flash("u_my_work_priority", "#00CC00", 0); //Flash

     //Additional comments
    var sAppendNotes="Assigned to Technician.";
    MainWin.g_form.setValue("comments", sAppendNotes.replace(/(?:\n\n)/g, "\n"));

    MainWin.g_form.setValue("work_notes", sCodeStamp + "\n- Assigned to Technician."); 
 
  }
 
}


function SendValue(sFieldName, sValue) {
  var sGREEN = "#00C00";
  var sREADONLY_PREFIX = "sys_readonly.";
  var sSELECTTAG = "SELECT";

  if (MainWin.g_form.getControl(sFieldName)) {
    if (MainWin.gel(sREADONLY_PREFIX + MainWin.g_form.getControl(sFieldName).id)) {
      AbortField(sFieldName);
      return;
    } else {
      MainWin.g_form.setValue(sFieldName, sValue);
      MainWin.g_form.flash(sFieldName, sGREEN, 0); //Flash
    }
  } else {
    console.log("SendValue cannot find field:" + sFieldName);
  }
}

function EmailNotification(sMessage,sEmailType) {
  var sNotificationText = "";

 sNotificationText = "\n" + sMessage;
  sNotificationText += "\n\n(Running Workflow Manager -v" + sAutoVer + ", Account:" + sAccount + ")";

  var PostUrl=  sNTTAPIURL+'rest/V2/PostErrorNotification/';

  var PostData=[{  
  
              "AccountName": ""+sAccount+"",
              "NotificationText": ""+sNotificationText+"",
              "EmailType": ""+sEmailType+""
    }];   
  
    jQuery.ajax({
      url: PostUrl,
      type: 'POST',
      headers: {
            'AppId': AppID,
            'ApiKey': APIKey
          },
      data: JSON.stringify(PostData),
      //contentType: 'application/json; charset=utf-8',
      //dataType: 'json',
      success: function() {
         AppendRunLog("Mail Sent Successfully");
          },
      error: function(error) {
         AppendRunLog(error);
          }
    });


 
  }


//added 4/1/2021 from dignity
function AbortField(sFieldName) {
  var sErrMsg = "DWS Utility Error: This field appears to be read-only or the given option for a dropdown field is not available.";
  var sMsgType = "error";
  var bScroll = true;

  nAbortedFields++;
  MainWin.g_form.showFieldMsg(sFieldName, sErrMsg, sMsgType, bScroll);
  if (nAbortedFields == 1) sUpdateNotes += "\n\n";
  sUpdateNotes += "Failed to update " + sFieldName;
}

//US Bank Project Variable
if (localStorage.USBProject == undefined) localStorage.USBProject = "no";

if (sAccount == "AMITA") {
  alert("Your account has been disabled.");
} else {
  /*Load up CSS and then Interface*/
  ConfigureDispatchInterface();
}
