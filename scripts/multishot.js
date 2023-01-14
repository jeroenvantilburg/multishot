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

  $('#expert').on('change', function(e) {
    $('.expert').toggle();
  });

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
    //setTimeout(function () {focusedElement.setSelectionRange(9999,9999);}, 0);
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
    
    canvasVideoCtx.restore(); // Go back to original state
    $("#orientationInput").val("0"); 
    videoRotation = 0;
    
    // Disable video control and reset video parameters when selecting new video
    disableAnalysis();
    disableVideoControl();
    //$('#frameNumber').html( "0 / 0" );
    //$("#slider").attr("max", 0 );
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
    
    // Get the frame rate
    getFPS();
  });
  
  // Show the video when it has been loaded
  video.addEventListener('loadeddata', () => {    
    gotoFrame( 0 );
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
      /*if( iOS() && videoRotation ) {        
        if( Math.abs(90 - videoRotation) < 1 ) {
          $("#orientationInput").val( "90" );
        } else if( Math.abs(180 - videoRotation ) < 1 ) {
          $("#orientationInput").val( "180" );
        } else if( Math.abs(270 - videoRotation ) < 1 ) { 
          $("#orientationInput").val( "270" );
        }
        canvasVideoCtx.save(); // save unrotated state
        rotateContext();
      }*/
      
      // Update frame rate
      let frameRate = MI.Get(MediaInfoModule.Stream.Video, 0, 'FrameRate');
      $("#fpsInput").val( frameRate );
      
      // Trigger a change such that the slider is set
      $("#fpsInput").change();

      // Get the video format
      videoFormat = MI.Get(MediaInfoModule.Stream.Video, 0, 'Format');

      // Finalize
      MI.Close();
      MI.delete();
      $('#statusMsg').html( "" );
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
      // Trigger a change such that the slider is set with the default value
      $("#fpsInput").change();
    }    

  }
  
  // Update the frame rate (fps) when user gives input or when calculated
  $("#fpsInput").change( function() {
    if( isNumeric(this.value) && toNumber(this.value) > 0 ) {

      // Set the new FPS
      FPS = toNumber(this.value);

      if( video.src !== "" ) {
        // Update the slider
        let lastFrame = Math.round( ((video.duration-t0) * FPS).toFixed(1) ) - 1;
        $("#slider-range").slider( "option", "max", lastFrame );
        $("#slider-range").slider("values", 0, 0);
        $("#slider-range").slider("values", 1, lastFrame);
        $("#startFrame").val(0);
        $("#endFrame").val(lastFrame);

        // Always reset to first frame
        gotoFrame( 0 );        
      }
    }
    this.value = FPS || "";
  });

  $("#orientationInput").change( function() { 
    rotateContext();
    gotoFrame(currentFrame);
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

  // Create a slider with jQuery UI
  $( function() {
    $( "#slider-range" ).slider({
      disabled: true,
      range: true,
      min: 0,
      max: 1,
      values: [ 0, 1 ],
      slide: function( event, ui ) {
        if( ui.handleIndex == 0 ) {
          $("#startFrame").val( ui.value );
        } else {
          $("#endFrame").val( ui.value );          
        }
        gotoFrame( ui.value );
      }
    });
    $("#startFrame").change( function() {
      $("#slider-range").slider("values", 0, this.value);
      gotoFrame( this.value );
    });
    $("#endFrame").change( function() {
      $("#slider-range").slider("values", 1, this.value);
      gotoFrame( this.value );
    });
  } );

  // Enable the video control buttons
  function enableVideoControl() {
    $('#play').removeAttr('disabled');
    $('#slider').removeAttr('disabled');
    $('#slider-range').slider( "option", "disabled", false );
    $('#startFrame').removeAttr('disabled');
    $('#endFrame').removeAttr('disabled');
    $("#zoomIn").removeAttr('disabled');
    $("#zoomOut").removeAttr('disabled');
    $('#showMediaInfo').removeAttr('disabled');
  }

  // Disable the video control buttons
  function disableVideoControl() {
    $('#play').attr('disabled', '');
    $('#slider').attr('disabled', '');  
    $('#slider-range').slider( "option", "disabled", true );
    $('#startFrame').attr('disabled', '');  
    $('#endFrame').attr('disabled', '');  
    $("#zoomIn").attr('disabled', '');
    $("#zoomOut").attr('disabled', '');
    $("#showMediaInfo").attr('disabled', '');
  }

  // Play the video (not an essential function, just to give the user a play button)
  let playing = false;
  $('#play').click(function() {
    $(this).find('.fa-play,.fa-pause').toggleClass('fa-pause').toggleClass('fa-play');
    if ( playing === false ) {
      playing = true;
      currentFrame = parseInt( $("#startFrame").val() );
      let lastFrame = parseInt( $("#endFrame").val() );
      let that = this;
      // Recursively calling next frame
      function playNextFrame() {
        if( playing && currentFrame < lastFrame && gotoFrame(currentFrame+1) ) {
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
    }
  });

  function tryToEnable() {
    if( video.src === "" ) return;
    enableVideoControl();
    if( openCVReady ) enableAnalysis();
  }

  // Enable, disable and set "Process video/Stop processing" button
  let processing = false;
  function setStartAnalysis() {
    processing = false;
    $("#startAnalysis").text( "Process video" );
    $("#startAnalysis").addClass("button-on");
    $("#startAnalysis").removeClass("button-off");    
  }
  function setStopAnalysis() {
    processing = true;
    $("#startAnalysis").text( "Stop processing" );
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
  
  // Event listener when clicking processing button
  $("#startAnalysis").click( () => {

    // Stop the player in case it is still playing
    if( playing ) {
      $('#play').click();
      return;
    }

    if( processing === false ) {
      
      // Change the button to "Stop processing"
      setStopAnalysis();

      startProcessing();

    } else {
      // Change the button to "Process video"
      setStartAnalysis();

      $('#statusMsg').html( "" );
    }    
  });

  $("#skipSlider").change( function() { 
    $("#skip").val( $(this).val() );
    showResult();
  });

  $("#skip").change( function() { 
    $("#skipSlider").val( $(this).val() );
    showResult();
  });

  function showResult() {

    let nSkip = parseInt($("#skip").val() );
    let f = parseInt($("#frequency").val());
    $("#deltaT").html( (nSkip*f/FPS).toPrecision(3).replace('.',',') + " s" );

    let newResult = new cv.Mat(video.height, video.width, cv.CV_8UC4);//bgMat.clone();
    cv.cvtColor( bgMat, newResult, cv.COLOR_BGR2BGRA );
    //console.log("numbers of frames = " + masks.length);
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

    $("#skip").val( 1 );
    $("#skipSlider").val( 1 );
    $('#statusMsg').html( "Processing..." );
    disableVideoControl();

    let firstFrame = parseInt( $("#startFrame").val() );
    let lastFrame  = parseInt( $("#endFrame").val() );

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
    let i = firstFrame;
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
        //let delay = 0;
        i += Math.round(f);
        if( i > lastFrame ) {
        //if( i/FPS > video.duration ) {
          //console.log("i=" + i);
          if( firstPass ) {
            firstPass = false;
            i = firstFrame;
            // Set the next iteration to zero
            lr = 0.0;
            //f = parseInt($("#frequency").val());
            //console.log("first pass done");
          } else {
            setStartAnalysis();
            $('#statusMsg').html( "" );
          }
        } 

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
        //video.currentTime = i/FPS ;
        gotoFrame( i );

        video.addEventListener("seeked", function(e) {
          // remove handler or else it will draw another frame on same canvas in next seek
          e.target.removeEventListener(e.type, arguments.callee); 
          //canvasVideoCtx.drawImage(video,0,0);
          setTimeout(processVideo, 0);
        });
      } catch (err) {
       console.error('There was an error:', err);
       console.error(cv.exceptionFromPtr(err).msg);
       alert( cv.exceptionFromPtr(err).msg );
      }
    };

    // schedule the first one.
    //video.currentTime = 0 ;
    gotoFrame( firstFrame );
    video.addEventListener("seeked", function(e) {
      // remove handler or else it will draw another frame on same canvas in next seek
      e.target.removeEventListener(e.type, arguments.callee); 
      //canvasVideoCtx.drawImage(video,0,0);
      //result = cv.imread('canvasVideo');
      setTimeout(processVideo, 0);     
    });
  }

  $("#download").click( function() { 
    let videoFile = $('#videoInput').prop('files')[0];
    let videoName = (typeof videoFile === "undefined" ) ? "multishot." : videoFile.name;
    let filename = prompt("Save as...", videoName.substr(0, videoName.lastIndexOf('.'))+".png");
    if (filename != null && filename != "") {
      let canvas = document.querySelector("#canvasResult");
      var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");; 
      download( filename, image);
    }
  });

  // Create an invisible download element
  function download(filename, image) {
    var element = document.createElement('a');
    element.setAttribute('href', image);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }  


})();