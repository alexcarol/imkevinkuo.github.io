var recordingBPM = 0;
var recordingNotes = 0;

var bpm = 0;
var interval = 0;
var keydown = 0;

var taps = [];
var NOTE_TYPES = [4, 3, 2.5, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.33, 0.66];
var NOTE_NAMES = ["whole", "dottedhalf", "halfneighth", "half", "dottedquarter", "quarter", "dottedeighth", "eighth", "sixteenth", "2etriplet", "2qtriplet"];

var task;


$(document).ready(function () {
	$("#bpm").click(bpmButton);
	$("#notate").click(notesButton);
	$(window).keyup(function(event) {
		keydown = 0;
	})
	/* Open and close modal */
	$("#help").click(function() {
		displayModal();
	});
	window.onclick = function(event) {
		hideModal();
	};
});
function hideModal() {
	if ($(".modal").css("opacity") == "1") {
		$(".modal").removeClass("active");
		setTimeout(function() {
			$(".modal").addClass("hidden");
		}, 400);
	}
}
function displayModal() {
	$(".modal").removeClass("hidden");
	$(".modal").addClass("active");
}
function createRipple() {
	var ripple = $("<div class='ripple'></div>").appendTo("body");
	setTimeout(function(){
		ripple.remove();
	}, 2500); 
}
function bpmButton() {
	if (recordingNotes == 1) {
		$("#bpm").text("Finish notating before resetting BPM.");
	}
	else if (recordingBPM == 1) {
		recordingBPM = 0;
		$(window).unbind("keydown");
		$("#bpm").html("BPM: " + bpm + "<br>Click to record new BPM.");
		$("#beat").css("animation-play-state", "running");
		$("#beat").css("animation-duration", interval + "ms");
	}
	else if (recordingBPM == 0) {
		recordingBPM = 1;
		$("#beat").css("animation-play-state", "paused");
		$("#bpm").text("Tap spacebar to the beat of your music.");
		var lastTap = 0;
		var intervalSum = 0; // intervalSum/totalTaps = averageInterval
		var totalTaps = 0;
		$(window).keydown(function( event ) {
			if (keydown == 0) {
				keydown = 1;
				if (event.which == 32) { // Spacebar
					createRipple();
					if (lastTap > 0) {
						totalTaps += 1;
						intervalSum += event.timeStamp - lastTap;
					}
					if (totalTaps > 1) {
						bpm = Math.round(60000/(intervalSum/totalTaps));
						interval = Math.round(60000/bpm);
						$("#bpm").html("BPM: " + bpm + "<br>Click to lock BPM."); // 60000ms in 1 minute
						$("#notate").html("2. Tap rhythm");
					}
					lastTap = event.timeStamp;
				}
			}
		});
	}
}

function stopNotating() {
	recordingNotes = 0;
	$(window).unbind("keydown");
	$("#notate").html("Done! <br>Click to record new rhythm.");
	parseTaps();
}
function notesButton(e) {
	if (recordingBPM == 1) {
		$("#notate").html("Finish setting BPM first.");
	}
	else if (recordingNotes == 1) {
		clearTimeout(task);
		taps.push(e.timeStamp);
		stopNotating();
	}
	else if (recordingNotes == 0) {
		if (bpm > 0) {
			recordingNotes = 1;
			taps = [];
			$("#notate").text("Tap the rhythm you want notated.");
			$(window).keydown(function( event ) {
				if (event.which == 32) { // Spacebar
					createRipple();
					if (taps.length == 0) {
						$("#notate").html("Notating for 8 measures...<br>Click to stop early.");
						task = setTimeout(function(){
							stopNotating();
							taps.push(event.timeStamp + interval*32);
						}, interval*32);
					}
					taps.push(event.timeStamp);
				}
			});
		}
		else {
			$("#notate").text("Please set BPM first.");
			setTimeout(function(){
				$("#notate").text("2. Tap rhythm");
			}, 1000);
		}
	}
}

function parseTaps() {
	//console.log(taps);
	var notes = [];
	var delays = [];
	console.log(taps);
	for (var i = 1; i < taps.length; i++) {
		delays.push(taps[i] - taps[i-1]);
	}
	console.log(delays);
	for (var i = 0; i < delays.length; i++) {
		notes.push(closestNote(delays, i, interval, 10));
	}
	for (var i = 0; i < notes.length; i++) {
		if (notes[i] == 0.33 || notes[i] == 0.66) {
			if (notes[i] != notes[i+1] && notes[i] != notes[i+2]) {
				notes[i] = closestNote(delays, i, interval, 8);
			}
			else {
				notes[i+1] = notes[i];
				notes[i+2] = notes[i];
			}
			i += 2;
		}
	}
	drawNotes(notes);
}

function findMin(array) {
	if (array.length > 0) {
		minIndex = 0;
		minimum = array[0];
		for (var i = 1; i < array.length; i++) {
			if (array[i] < minimum) {
				minIndex = i;
				minimum = array[i];
			}
		}
		return minIndex;
	}
	return [-1, -1];
}

function closestNote(delays, i, interval, endIndex) {
	var time = delays[i];
	var ratio = time/interval;
	var differences = NOTE_TYPES.slice(0, endIndex);
	for (var i = 0; i < differences.length; i++) {
		differences[i] = Math.abs(differences[i] - ratio);
	}
	var minIndex = findMin(differences);
	var minNote = NOTE_TYPES[minIndex];
	return NOTE_TYPES[minIndex];
}

function drawNotes(notes) {
	$('#staff').html("");
	for (var n = 0; n < notes.length; n++) {
		var note = $("<div class='note'>" + notes[n] + "</div>").appendTo("#staff");
		note.css("width", notes[n]*6 + "rem");
	}
}