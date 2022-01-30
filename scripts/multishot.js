// All code runs in this anonymous function
// to avoid cluttering the global variables
(function() {

  /* ========== GLOBAL SECTION =================
       Global variables are defined here
     =========================================== */
  
  // HTML elements
  let video           = document.getElementById('video');
  let canvasVideo     = document.getElementById('canvasVideo');
  let canvasVideoCtx  = canvasVideo.getContext('2d');
  canvasVideoCtx.save();
  
  // Global video parameters
  let currentFrame = 0;
  let t0 = 0;
  let zoomLevel = 1;
  let FPS = toNumber( $("#fpsInput").val() );
  let videoRotation = 0; // in degrees
  //let demoLocation = "videos/demo_bounching_ball.mp4";
  let videoFormat = "";

  /* ========== RESPONSIVE SECTION =============
       Adjust design to screen size
     =========================================== */
  
  // load all code after the document
  $("document").ready( () => {
    $("#videoImport").removeAttr('disabled'); // Videos can now be imported
    setFeedback();
  });
  
  // set the feedback tag
  function setFeedback() {
    var name = "smackjvantilburgsmack"; // add salt
    name = name.substr(5,11); // remove salt
    $("feedback").html(name+"@gmail.com");  
  }

  /* ======= DROPDOWN MENU SECTION =============
     Hovering, clicking on dropdown menu
     =========================================== */  

  // Event listeners for the dropdown menu
  function showDropdownMenu() { 
    $(".dropbtn").css("background-color","#aaa");
    $(".dropdown-content").show();}
  function hideDropdownMenu() {
    $(".dropbtn").css("background-color","inherit");
    $(".dropdown-content").hide();
  }
  $(".dropdown").hover( showDropdownMenu, hideDropdownMenu );
  $(".dropdown-content").on("click", hideDropdownMenu );
  $(".dropbtn").on("click touchend", (e) => { 
    // prevent touch event from propagating and showing dropdown via onmouseenter + click method
    if( e.type == "touchend" ) e.preventDefault();    
    if( $(".dropdown-content").is(":visible") ) hideDropdownMenu() ;
    else if( $(".dropdown-content").is(":hidden") ) showDropdownMenu() ;
  } );
  // Close the dropdown menu when user touches anywhere outside the menu
  $(window).on("touchend", (e) => {
    if( $(".dropdown-content").is(":visible") &&
        $(".dropdown").has(e.target).length == 0 ) hideDropdownMenu();
  });

  
  /* ============= MODAL SECTION =================
     Define functions for the modal boxes.
     Shows and hides the modal boxes.
     =========================================== */    

  // Event listener for the different modal boxes
  $("#showMediaInfo").click( evt => { writeVideoInfo(); showModal("mediaInfoModal"); });
  $("#showAbout").click( evt => { showModal("aboutModal"); } );
  $("#showHelp").click( evt => { showModal("helpModal");} );
  $("#showSettings").click( evt => { showModal("settingsModal");} );
  
  // Showing modal box
  function showModal(name) { $("#"+name).toggle(); }

  // When the user clicks on <span> (x), close the current modal
  $(".close").on("click", function() { $(this).parent().parent().toggle(); });
  
  // When the user clicks anywhere outside of the modal, close it
  $(window).on("click", function(event) {
    if( event.target.className === "modal" ) event.target.style.display = "none";
  });

  
  /* ===== INPUT TEXT ELEMENTS SECTION =========
     Define functions for the modal boxes.
     Shows and hides the modal boxes.
     =========================================== */    

  // Remove focus after enter for all input text elements
  let focusedElement;
  function blurOnEnter(e){ 
    if(e.keyCode===13){ 
      e.target.blur();
      focusedElement = null;
    } 
  }
  $("input[type=text]").on("keydown", blurOnEnter );
  $("input[type=number]").on("keydown", blurOnEnter );

  // Put cursor always at last position when clicking on input text element
  $(document).on('focus', 'input[type=text], input[type=number]', function () {    
    //already focused, return so user can now place cursor at specific point in input.    
    if (focusedElement == this) return; 
    focusedElement = this;
    // select all text in any field on focus for easy re-entry. 
    // Delay sightly to allow focus to "stick" before selecting.
    setTimeout(function () {focusedElement.setSelectionRange(9999,9999);}, 0);
  });

  
  /* ========== General functions ====================
      Useful functions to check/convert numbers
     ================================================= */
  
  function toNumber(string){
    return parseFloat( parseFloat( string.replace(',','.') ).toPrecision(6));
  }

  function isNumeric(str) {
    if (typeof str != "string") return false; // we only process strings!  
    let string = str.replace(',','.')
    return !isNaN(string) && // use type coercion to parse the _entirety_ of the string
           !isNaN(parseFloat(string)) // ...and ensure strings of whitespace fail
  }
 
  function iOS() {
    return [ 'iPad Simulator', 'iPhone Simulator', 'iPod Simulator',
            'iPad', 'iPhone', 'iPod' ].includes(navigator.platform)
      || (navigator.userAgent.includes("Mac") && "ontouchend" in document);  // iPad on iOS 13 detection
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /* ========= Load the MediaInfo library ============
       Dynamically choose between Wasm and 
       asm.js libraries.
     ================================================= */

  let MediaInfoJs = document.createElement('script');
  if ('WebAssembly' in window && typeof Promise  !== 'undefined' && !iOS() ) {
    // Only browsers that support Wasm, Promise. iOS gives maximum stack size exceeded error
    MediaInfoJs.src = "scripts/MediaInfoWasm.js";
  } else {
    MediaInfoJs.src = "scripts/MediaInfo.js";
  }
  document.body.appendChild(MediaInfoJs);

  // Continue initialization
  let MediaInfoModule;
  MediaInfoJs.onload = function () {
    MediaInfoModule = MediaInfoLib({
      'postRun': function() {
        if (typeof Promise !== 'undefined' && MediaInfoModule instanceof Promise) {
          MediaInfoModule.then(function(module) {          
            MediaInfoModule = module;
          });
        }
      }
    });
  }

  /* ============= VIDEO SECTION =================
     Importing a video file
     =========================================== */  
  
  // Trigger click on videoInput when user clicks on menu item
  $("#videoImport").click( () => {
    // Reset the file input such that it triggers any change
    $("#videoInput").val('');

    // Progagate to (hidden) DOM element
    $("#videoInput").click();
  });
  
  // Clear old data and video stuff
  function clearDataAndVideo() {
    // Remove old video source
    video.removeAttribute('src'); // empty source
    video.load();

    // Clear raw data and meta data
    //FPS = undefined;
    //updateFPS();
    
    canvasVideoCtx.restore(); // Go back to original state
    $("#orientationInput").val("0"); 
    videoRotation = 0;
    
    // Disable video control and reset video parameters when selecting new video
    disableAnalysis();
    disableVideoControl();
    $('#frameNumber').html( "0 / 0" );
    $("#slider").attr("max", 0 );
  }
  
  // Add event listener for when file is selected
  $("#videoInput").change( function() {

    // Remove old data and video elements
    clearDataAndVideo();

    // Get the file
    let URL = window.URL || window.webkitURL;
    let file = this.files[0];
    video.src = URL.createObjectURL(file);
  });
  
  // video playback failed - show a message saying why
  video.addEventListener('error', (e) => {
    switch (e.target.error.code) {
      case e.target.error.MEDIA_ERR_ABORTED:
        alert('You aborted the video playback.');
        break;
      case e.target.error.MEDIA_ERR_NETWORK:
        alert('A network error caused the video download to fail part-way.');
        break;
      case e.target.error.MEDIA_ERR_DECODE:
        alert('The video playback was aborted due to a corruption problem '+ 
              'or because the video used features your browser did not support.');
        break;
      case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        alert('The video could not be loaded, either because the server or '+
               'network failed or because the format is not supported.');
        break;
      default:
        alert('An unknown error occurred.');
        break;
    }
    // Remove old data and video elements
    clearDataAndVideo();
  });
  
  
  // Prepare canvas size, calibration controls and set frame rate when meta data is available
  video.addEventListener('loadedmetadata', () => {

    // Pause the video (needed because of autoplay)
    video.pause();
    
    // Set the dimensions of the video and prepare the canvas
    setVideoZoom(1.0);
    
    // Prepare analysis for the demo video
    /*if( (video.src).endsWith( demoLocation ) ) {

      // Put the graphics back
      showCalibrationControls();

      // Get the frame rate
      updateFPS( "29.97" );
      
      $('#statusMsg').html('Click on "Start analysis" ' );
      return;
    }*/
    
    // Highlight fields that still need to be filled
    //$("#fpsInput").css("background", "pink");
    
    // Put the graphics back
    //showCalibrationControls();

    // Get the frame rate
    getFPS();

    //else $('#statusMsg').html("Set the frame rate manually");
  });
  
  // Show the video when it has been loaded
  video.addEventListener('loadeddata', () => {    
    let firstFrame = 0;
    //if( (video.src).endsWith( demoLocation ) ) firstFrame = 5; // exception for the demo
    gotoFrame( firstFrame );
    tryToEnable();
  });

  /* ====== MEDIAINFO (FPS) SECTION ============
     Get the frame rate (fps) and rotation
     from the MediaInfo library
     =========================================== */    

  // Get the frame rate and the rotation from the MediaInfo library 
  function getFPS() {
    $('#statusMsg').html( "Calculating frame rate... <i class='fa fa-spinner fa-spin fa-fw'></i>" );
       
    // Callback function to get the results back from MediaInfo
    let MI;
    let getResults = function() {

      // Update orientation/rotation
      videoRotation = MI.Get(MediaInfoModule.Stream.Video, 0, 'Rotation');
      if( iOS() && videoRotation ) {        
        if( Math.abs(90 - videoRotation) < 1 ) {
          $("#orientationInput").val( "90" );
        } else if( Math.abs(180 - videoRotation ) < 1 ) {
          $("#orientationInput").val( "180" );
        } else if( Math.abs(270 - videoRotation ) < 1 ) { 
          $("#orientationInput").val( "270" );
        }
        canvasVideoCtx.save(); // save unrotated state
        rotateContext();
      }
      
      // Update frame rate
      let frameRate = MI.Get(MediaInfoModule.Stream.Video, 0, 'FrameRate');
      $("#fpsInput").val( frameRate );

      // Get the video format
      videoFormat = MI.Get(MediaInfoModule.Stream.Video, 0, 'Format');

      // Finalize
      MI.Close();
      MI.delete();
    }
              
    // Initialise MediaInfo
    //MI = new MediaInfoModule.MediaInfo();

    //Open the file
    try{
      // Initialise MediaInfo
      MI = new MediaInfoModule.MediaInfo();
      
      const file = $('#videoInput').prop('files')[0];
      MI.Open(file, getResults);
    } catch (error) {
      alert("An error occured. Please set frame rate manually.\n" + error);
      $('#statusMsg').html( "" );
    }    

    // Trigger a change such that the slider is set
    $("#fpsInput").change();
  }
  
  // Update the frame rate (fps)
  /*function updateFPS( rate ) {
    $("#fpsInput").val( rate );
    $("#fpsInput").change();
  }*/

  // Update the frame rate (fps) when user gives input or when calculated
  $("#fpsInput").change( function() {
    if( isNumeric(this.value) && toNumber(this.value) > 0 ) {

      // Remove status message
      //$('#statusMsg').html( "" );   
      //this.style.background = ""; // remove pink alert

      // Set the new FPS
      FPS = toNumber(this.value);

      // Clear raw data
      //deleteRawData();
      
      if( video.src !== "" ) {
        // Update the slider
        $("#slider").attr("max", Math.round( ((video.duration-t0) * FPS).toFixed(1) ) - 1 );
    
        // Always reset to first frame
        //if( !(video.src).endsWith( demoLocation ) ) 
        gotoFrame( 0 );
        
        // Video can be enabled
        //tryToEnable();
      }
    } //else if (this.value == "expert") {
      //setExpert();
    //}
    this.value = FPS || "";
  });

  // Rotate the video context (only needed for iOS due to bug)
  function rotateContext() {
    canvasVideoCtx.restore(); // remove old rotation
    canvasVideoCtx.save();    // save for next time
    if( $("#orientationInput").val() == "0" ) return;
    
    let aspectRatio = video.videoWidth / video.videoHeight;
    if( $("#orientationInput").val() == "90" ) {
      canvasVideoCtx.rotate(Math.PI/2 );
      canvasVideoCtx.translate(0, -video.videoWidth );
      if( aspectRatio < 1 ) canvasVideoCtx.scale( 1/aspectRatio, 1);
      else canvasVideoCtx.scale( 1/aspectRatio, aspectRatio );
    } else if( $("#orientationInput").val() == "180" ) {
      canvasVideoCtx.rotate(Math.PI );
      canvasVideoCtx.translate(-video.videoWidth, -video.videoHeight );
    } else if( $("#orientationInput").val() == "270" ) { 
      canvasVideoCtx.rotate(-Math.PI/2 );
      canvasVideoCtx.translate(-video.videoHeight, 0 );
      if( aspectRatio < 1 ) canvasVideoCtx.scale( 1/aspectRatio, 1);
      else canvasVideoCtx.scale( 1/aspectRatio, aspectRatio );
    }
  }

  /* ======== VIDEO CONTROL SECTION ============
     Control the video with play/stop, next and
     prev functions
     =========================================== */    

  // Enable the video control buttons
  function enableVideoControl() {
    $('#prev').removeAttr('disabled');
    $('#play').removeAttr('disabled');
    $('#next').removeAttr('disabled');
    $('#slider').removeAttr('disabled');
    $("#zoomIn").removeAttr('disabled');
    $("#zoomOut").removeAttr('disabled');
    $('#showMediaInfo').removeAttr('disabled');
  }

  // Disable the video control buttons
  function disableVideoControl() {
    $('#prev').attr('disabled', '');
    $('#play').attr('disabled', '');
    $('#next').attr('disabled', '');
    $('#slider').attr('disabled', '');  
    $("#zoomIn").attr('disabled', '');
    $("#zoomOut").attr('disabled', '');
    $("#showMediaInfo").attr('disabled', '');
  }

  // Go to the previous frame
  $('#prev').click(function() { gotoFrame(currentFrame-1); });

  // Go to the next frame
  $('#next').click(function() { gotoFrame(currentFrame+1); });

  // Update the frame when slider changes
  $("#slider").change( function() { gotoFrame(Math.floor(this.value)); });

  // Play the video (not an essential function, just to give the user a play button)
  let playing = false;
  $('#play').click(function() {
    $(this).find('.fa-play,.fa-pause').toggleClass('fa-pause').toggleClass('fa-play');
    if ( playing === false ) {
      playing = true;
      let that = this;
      // Recursively calling next frame
      function playNextFrame() {
        if( playing && gotoFrame(currentFrame+1) ) {
          video.addEventListener("seeked", function(e) {
            e.target.removeEventListener(e.type, arguments.callee);
            window.setTimeout( playNextFrame, 1000/FPS );
          });
        } else if( playing ) {
          playing = false;
          $(that).find('.fa-play,.fa-pause').toggleClass('fa-pause').toggleClass('fa-play');         
        }
      }
      playNextFrame();      
    } else {
      playing = false;
    }
  });

  // Show the text on the video and remove it after 1 s
  let videoTimeoutID = 0;
  function flashTextOnVideo( text ) {
    $("#videoText").html( text );
    clearTimeout( videoTimeoutID ); // remove previous timeout
    videoTimeoutID = setTimeout( () =>{ $("#videoText").html( "" ); }, 1000 );
  }
  
  // Get the time from a frame number
  function getTime(targetFrame) {
    return FPS ? (t0 + (targetFrame + 0.5)/FPS) : 0 ;
  }

  // Move the video to the given target frame
  function gotoFrame(targetFrame) {
    let newTime = getTime( targetFrame );     
    if( newTime < t0 ) {
      return false;
    } else if( newTime > video.duration ) {
      return false;
    } else {
      // Draw the current time and remove it after 1 s
      flashTextOnVideo( newTime.toFixed(2) + " s" );
          
      currentFrame = targetFrame;
      video.currentTime = newTime;
      video.addEventListener("seeked", function(e) {
        // remove the handler or else it will draw another frame on the same canvas in next seek
        e.target.removeEventListener(e.type, arguments.callee); 
        
        canvasVideoCtx.drawImage(video,0,0);
        $('#frameNumber').html( currentFrame + " / " + $("#slider").attr("max") );
        $("#slider").val( currentFrame );
      });
      return true;
    }
  }
  
  function toCSV(number, precision = 6) { // precision=6 is maximum to be recognised as number
    // Store numbers to 6 digits precision
    return number.toPrecision(precision).toString().replace('.',',');
  }

  // Show the video information in the video info modal
  function writeVideoInfo() {
    // Show video info
    let videoFile = $('#videoInput').prop('files')[0];
    let videoName = "", videoType = "", videoSize = "";
    if( typeof videoFile !== "undefined" ) {
      videoName = videoFile.name;
      videoType = videoFile.type;
      videoSize = formatBytes(videoFile.size);
    }
    let videoInfo = [{ "Name": videoName, "Duration": toCSV(video.duration)+" s", 
                       "Width": video.videoWidth + " px", "Height": video.videoHeight + " px",
                       "Rotation": videoRotation + "&deg;", "MIME type": videoType,
                       "Format": videoFormat, "File size": videoSize }];
    $("#videoInfo").html( convertToTable( videoInfo )  );
  }
  
  // Make a nice looking table from the video info object
  function convertToTable(tracks) {
    let output = "\n <table>";
    tracks.forEach(track => {
      for (const [key, value] of Object.entries(track)) {
        if( key === "Name" ) {
          output += `<tr class="table-header"><th colspan=2>${value}</th></tr>\n`;
        } else {
          output += `<tr><td>${key}</td><td>${value}</td></tr>\n`;
        }
      }
    } );
    output += "</table>";  
    return output;
  }

  /* ============ ZOOMING SECTION ====================
     Zooming in and out on the video
     ================================================= */

  $("#zoomOut").click( () => {
    if( canvasVideo.width > 200 ) { // minimum 200 px should be small enough
      setVideoZoom( 0.5*canvasVideo.width / video.videoWidth );
      $("#zoomIn").removeAttr('disabled');
      if( canvasVideo.width <= 200 ) $("#zoomOut").attr('disabled', '');
    }
  });

  $("#zoomIn").click( () => {
    if( canvasVideo.width*canvasVideo.height < 4e6 ) { // Maximum canvas size: 16 Mpx
      setVideoZoom( 2*canvasVideo.width / video.videoWidth );
      $("#zoomOut").removeAttr('disabled');
      if( canvasVideo.width*canvasVideo.height >= 4e6 ) $("#zoomIn").attr('disabled', '');
    }
  });
  
  // The actual zooming function
  function setVideoZoom( newZoom ) {
    // Calculate the relative zoom and save the previous zoom level
    let relZoom = newZoom / zoomLevel;
    let prevZoom = zoomLevel;
        
    // Update to new zoom level
    zoomLevel = newZoom;
    
    // Update the video canvas
    canvasVideo.width = video.videoWidth * newZoom;
    canvasVideo.height = video.videoHeight * newZoom;
    canvasVideoCtx.scale(newZoom,newZoom);
    canvasVideoCtx.save(); // save unrotated state
    rotateContext(); // rotate context due to bug/feature in iOS    
    canvasVideoCtx.drawImage(video,0,0);
    
    // Show the current zoom level
    flashTextOnVideo( zoomLevel + "x" );
  }
  
  
  /* =========== ANALYSIS SECTION =============
     Enable/disable button
     =========================================== */    

  let bgMat;
  let masks = [];
  let fgmasks = [];

  // Enable automatic analysis only when openCV is ready
  let openCVReady = false;
  $("#opencv").on("load", () => {
    cv['onRuntimeInitialized']=()=>{
      openCVReady = true;
      tryToEnable();
      
      // Only enable the automatic analysis when Start analysis button is enabled
      //if( !($("#startAnalysis").prop("disabled")) ) 
      //$("#automaticAnalysis").removeAttr('disabled');
      
    }
  });

  function tryToEnable() {
    if( video.src === "" ) return;
    //if( $("#fpsInput").val() !== "" ) {
    enableVideoControl();
      //$('#statusMsg').html("");
    if( openCVReady ) enableAnalysis();
    //}
  }

  // Enable, disable and set "Start/Stop analysis" button
  let processing = false;
  function setStartAnalysis() {
    processing = false;
    $("#startAnalysis").text( "Start analysis" );
    $("#startAnalysis").addClass("button-on");
    $("#startAnalysis").removeClass("button-off");    
  }
  function setStopAnalysis() {
    processing = true;
    $("#startAnalysis").text( "Stop analysis" );
    $("#startAnalysis").addClass("button-off");
    $("#startAnalysis").removeClass("button-on");
  }  
  function enableAnalysis() {
    $("#startAnalysis").removeAttr('disabled');
    setStartAnalysis();
  }
  function disableAnalysis() {    
    $("#startAnalysis").attr('disabled', '');    
    setStartAnalysis();
    $('#statusMsg').html("");
  }
  
  // Event listener when clicking "Start/Stop analysis" button
  $("#startAnalysis").click( () => {

    // Stop the player in case it is still playing
    if( playing ) {
      $('#play').click();
      return;
    }

    if( processing === false ) {
      
      // Change the button to "Stop analysis"
      setStopAnalysis();

      //$('#statusMsg').html( "Processing..." );
      startProcessing();

    } else {
      // Change the button to "Start analysis"
      setStartAnalysis();

      $('#statusMsg').html( "" );
    }    
  });

  $("#skip").change( function() { showResult() });

  function showResult() {

    let nSkip = parseInt($("#skip").val() );
    
    let newResult = new cv.Mat(video.height, video.width, cv.CV_8UC4);//bgMat.clone();
    cv.cvtColor( bgMat, newResult, cv.COLOR_BGR2BGRA );
    console.log("numbers of frames = " + masks.length);
    for( let i=0; i < masks.length && nSkip > 0; i += nSkip ) {
      masks[i].copyTo(newResult, masks[i]);
    }

    for( let j=0; j < fgmasks.length && nSkip > 0; j += nSkip ) {
      fgmasks[j].copyTo(newResult, fgmasks[j]);
    }

    cv.imshow('canvasResult', newResult);
    newResult.delete();
  }


  function startProcessing() {

    $('#statusMsg').html( "Processing..." );
    disableVideoControl();

    // Remove old bgmat
    if( bgMat ) bgMat.delete();
    for( let i=0; i<masks.length; ++i) {
      masks[i].delete();
      fgmasks[i].delete();
    }
    masks = [];
    fgmasks = [];

    // take first frame of the video
    let frameRGB = new cv.Mat();
    let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let mask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    let fgmask = new cv.Mat(video.height, video.width, cv.CV_8UC1);

    bgMat = new cv.Mat(video.height, video.width, cv.CV_8UC3);

    let f = parseInt($("#frequency").val());
    let threshold = toNumber($("#threshold").val());
    let history = Math.round( 2*FPS * video.duration / f); 
    let fgbg = new cv.BackgroundSubtractorMOG2(history, threshold, true);
    let lr= toNumber($("#learningRate").val());
    let i = 0;
    let firstPass = $('#twoPass').is(':checked'); // False = No second pass
    fgbg.setNMixtures( toNumber($("#nmixtures").val()) ); 
    fgbg.setBackgroundRatio( toNumber($("#backgroudRatio").val()) ); 
    fgbg.setShadowThreshold( toNumber($("#shadowThreshold").val()) ); 
    fgbg.setVarThresholdGen( toNumber($("#varThresholdGen").val()) ); 
    fgbg.setVarInit( toNumber($("#varInit").val()) ); 
    fgbg.setVarMin( toNumber($("#varMin").val()) ); 
    fgbg.setVarMax( toNumber($("#varMax").val()) ); 
    fgbg.setComplexityReductionThreshold( toNumber($("#CRT").val()) ); 

    function processVideo() {
      try {
        if (!processing) {
          // clean and stop.
          //console.log("Stopping streaming");
          //console.log( "i = " + i);
          fgbg.getBackgroundImage(bgMat);

          frame.delete(); mask.delete(); fgbg.delete();
          frameRGB.delete(); fgmask.delete();
          tryToEnable();
          showResult();
          showModal("resultModal");
          return;
        }
        // start processing.
        frame = cv.imread('canvasVideo');

        // See: https://github.com/opencv/opencv/issues/17206
        cv.cvtColor(frame, frameRGB, cv.COLOR_RGBA2RGB);

        fgbg.apply(frameRGB, mask, lr);

        if( !firstPass ) {
          cv.threshold(mask, fgmask, 200, 255, cv.THRESH_BINARY);
          let fgtemp = new cv.Mat(video.height, video.width, cv.CV_8UC4, [0, 0, 0, 255]);
          frame.copyTo(fgtemp, fgmask);
          let temp = new cv.Mat(video.height, video.width, cv.CV_8UC4, [0, 0, 0, 255]);
          frame.copyTo(temp, mask);
          masks.push( temp );
          fgmasks.push( fgtemp );
        }

        //cv.imshow('canvasOutput', mask);
        //fgbg.getBackgroundImage(bgMat);
        //cv.imshow('canvasOutput2', bgMat);
        //console.log("i=" + i);

        // schedule the next one.
        let delay = 0;
        i += Math.round(f);
        if( i/FPS > video.duration ) {
          console.log("i=" + i);
          if( firstPass ) {
            firstPass = false;
            i = 0;
            // Set the next iteration to zero
            lr = 0.0;
            console.log("first pass done");
          } else {
            setStartAnalysis();
            $('#statusMsg').html( "" );
          }
        }
        video.currentTime = i/FPS ;

        video.addEventListener("seeked", function(e) {
          // remove handler or else it will draw another frame on same canvas in next seek
          e.target.removeEventListener(e.type, arguments.callee); 
          canvasVideoCtx.drawImage(video,0,0);
          setTimeout(processVideo, delay);
       
        });
      } catch (err) {
       console.error('There was an error:', err);
       console.error(cv.exceptionFromPtr(err).msg);
       alert( cv.exceptionFromPtr(err).msg );
      }
    };

    // schedule the first one.
    video.currentTime = 0 ;
    video.addEventListener("seeked", function(e) {
      // remove handler or else it will draw another frame on same canvas in next seek
      e.target.removeEventListener(e.type, arguments.callee); 
      canvasVideoCtx.drawImage(video,0,0);
      //result = cv.imread('canvasVideo');
      setTimeout(processVideo, 0);     
    });
  }



  /*const FPS = 30;
  let streaming = false;
  let video = document.getElementById('video');
  let canvasVideo     = document.getElementById('canvasVideo');
  let canvasVideoCtx  = canvasVideo.getContext('2d');
  let startAndStop = document.getElementById('startAndStop');

// Trigger click on videoInput when user clicks on menu item
$("#videoImport").click( () => {
      $("#videoInput").click();
});

// Add event listener for when file is selected
$("#videoInput").change( function() {
    // Get the file
    let URL = window.URL || window.webkitURL;
    let file = this.files[0];
    video.src = URL.createObjectURL(file);
    //console.log("Imported video");
});

  // Prepare canvas size, calibration controls and set frame rate when meta data is available
video.addEventListener('loadedmetadata', () => {
    //console.log("Loaded metadata");
    video.height = video.videoHeight;
    video.width = video.videoWidth;
    canvasVideo.width = video.videoWidth;
    canvasVideo.height = video.videoHeight;
    video.pause();    // Pause the video (needed because of autoplay)
    $("#history").val( Math.round(FPS * video.duration) );
});


// Show the video when it has been loaded
video.addEventListener('loadeddata', () => {    
    //video.currentTime( 0 );
    //console.log("Loaded video");
    canvasVideoCtx.drawImage(video,0,0);
});


startAndStop.addEventListener('click', () => {
    if (!streaming) {
      onVideoStarted();
    } else {
      onVideoStopped();
    }
});

function onVideoStarted() {
      streaming = true;
      video.height = video.videoHeight;
      video.width = video.videoWidth;
      canvasVideo.width = video.videoWidth;
      canvasVideo.height = video.videoHeight;
      startAndStop.innerText = 'Stop';
      startAnalysis();    
}

function onVideoStopped() {
    streaming = false;
    video.currentTime = 0;
    startAndStop.innerText = 'Start';
}

document.getElementById('opencv').onload = function () {
  console.log("OpenCV is ready");
  video.addEventListener('canplay', () => {
        startAndStop.removeAttribute('disabled');
  });
  // Use this only with: python3 -m http.server --cgi 8080
  //video.src="demo_bounching_ball.mp4";
  //console.log(video);
  if( window.cv instanceof Promise ) {
    console.log("cv returns a promise");
    window.cv.then((target) => {
      window.cv = target;
      console.log( target );
    })
  }
  
};

let masks = [];
let fgmasks = [];
let bgMat;


$("#skip").change( function() { showResult( parseInt($(this).val()) ); });

function showResult(nSkip) {

  let newResult = new cv.Mat(video.height, video.width, cv.CV_8UC4);//bgMat.clone();
  cv.cvtColor( bgMat, newResult, cv.COLOR_BGR2BGRA );
  console.log("numbers of frames = " + masks.length);
  for( let i=0; i < masks.length && nSkip > 0; i += nSkip ) {
    masks[i].copyTo(newResult, masks[i]);
  }

  for( let j=0; j < fgmasks.length && nSkip > 0; j += nSkip ) {
    fgmasks[j].copyTo(newResult, fgmasks[j]);
  }

  cv.imshow('canvasOutput3', newResult);
  newResult.delete();
}


function startAnalysis() {

canvasVideoCtx.drawImage(video,0,0);

// Remove old bgmat
if( bgMat ) bgMat.delete();
for( let i=0; i<masks.length; ++i) {
  masks[i].delete();
  fgmasks[i].delete();
}
masks = [];
fgmasks = [];

// take first frame of the video
let frameRGB = new cv.Mat();
let frame = new cv.Mat(video.height, video.width, cv.CV_8UC4);
let mask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
let fgmask = new cv.Mat(video.height, video.width, cv.CV_8UC1);

bgMat = new cv.Mat(video.height, video.width, cv.CV_8UC3);

let f = parseInt($("#frequency").val());
let threshold = parseFloat($("#threshold").val());
let history = Math.round( 2 * parseInt($("#history").val()) / f );
let fgbg = new cv.BackgroundSubtractorMOG2(history, threshold, true);
let lr=parseFloat($("#learningRate").val());
let i = 0;
let firstPass = $('#twoPass').is(':checked'); // False = No second pass
fgbg.setNMixtures( parseFloat($("#nmixtures").val()) ); 
fgbg.setBackgroundRatio( parseFloat($("#backgroudRatio").val()) ); 
fgbg.setShadowThreshold( parseFloat($("#shadowThreshold").val()) ); 
fgbg.setVarThresholdGen( parseFloat($("#varThresholdGen").val()) ); 
fgbg.setVarInit( parseFloat($("#varInit").val()) ); 
fgbg.setVarMin( parseFloat($("#varMin").val()) ); 
fgbg.setVarMax( parseFloat($("#varMax").val()) ); 
fgbg.setComplexityReductionThreshold( parseFloat($("#CRT").val()) ); 


function processVideo() {
    try {
        if (!streaming) {
            // clean and stop.
            //console.log("Stopping streaming");
            //console.log( "i = " + i);

            showResult( parseInt($("#skip").val()) );
            frame.delete(); mask.delete(); fgbg.delete();
            frameRGB.delete(); fgmask.delete();
            return;
        }
        // start processing.
        frame = cv.imread('canvasVideo');

        // See: https://github.com/opencv/opencv/issues/17206
        cv.cvtColor(frame, frameRGB, cv.COLOR_RGBA2RGB);
        //cv.medianBlur(frameRGB, frameRGB, 3);

        fgbg.apply(frameRGB, mask, lr);

        if( !firstPass ) {
          cv.threshold(mask, fgmask, 200, 255, cv.THRESH_BINARY);

            //let fgmask2 = new cv.Mat(video.height, video.width, cv.CV_8UC1);
            //let M = cv.Mat.ones(2, 2, cv.CV_8U);
            //cv.erode(fgmask, fgmask, M);
            //cv.dilate(fgmask, fgmask, M);
            //cv.threshold(fgmask, fgmask, 100, 255, cv.THRESH_BINARY);
            
            //cv.bilateralFilter(fgmask, fgmask, 9, 150, 175, cv.BORDER_DEFAULT);
            //cv.medianBlur(fgmask, fgmask, 3);

          let fgtemp = new cv.Mat(video.height, video.width, cv.CV_8UC4, [0, 0, 0, 255]);
          frame.copyTo(fgtemp, fgmask);
          let temp = new cv.Mat(video.height, video.width, cv.CV_8UC4, [0, 0, 0, 255]);
          frame.copyTo(temp, mask);
          masks.push( temp );
          fgmasks.push( fgtemp );
        }

        cv.imshow('canvasOutput', mask);
        fgbg.getBackgroundImage(bgMat);
        cv.imshow('canvasOutput2', bgMat);
        //console.log("i=" + i);

        // schedule the next one.
        let delay = 0;//1000/FPS - (Date.now() - begin);
        i += Math.round(f);
        //setTimeout(processVideo, delay);
        if( i/FPS > video.duration ) {
          if( firstPass ) {
            firstPass = false;
            i = 0;
            // Set the next iteration to zero
            lr = 0.0;
            //console.log("threshold= " + fgbg.getVarThreshold(  ));
          } else {
            onVideoStopped();
          }
        }
        video.currentTime = i/FPS ;

        video.addEventListener("seeked", function(e) {
          // remove handler or else it will draw another frame on same canvas in next seek
          e.target.removeEventListener(e.type, arguments.callee); 
          canvasVideoCtx.drawImage(video,0,0);
          setTimeout(processVideo, delay);
       
        });

    } catch (err) {
       console.error('There was an error:', err);
       //utils.printError(err);
       console.log(cv.exceptionFromPtr(err).msg);
    }
};

// schedule the first one.
video.currentTime = 0 ;
video.addEventListener("seeked", function(e) {
  // remove handler or else it will draw another frame on same canvas in next seek
  e.target.removeEventListener(e.type, arguments.callee); 
  canvasVideoCtx.drawImage(video,0,0);
  //result = cv.imread('canvasVideo');
  setTimeout(processVideo, 0);
       
});


};*/

})();