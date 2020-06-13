const ctx = new (window.AudioContext || window.webkitAudioContext)
const fft = new AnalyserNode(ctx, {fftsize : 2048})

// Vibe mode... make graphics cool!
energy = 0

// Initialize video element to none; user has to accept for it to be created
var capture;
var poseNet;
var poses = [];

// Particles for the wrist animation!
var particles = [];

// Taken from Nick's videos and guides
// opts fields: (param, peak, hold, time, a, d, s, r)

function adsr (opts) {
    /* 0.8 second adsr, so ~120 bpm half note
                  peak
                  /\   hold  hold
                 /| \__|____|
                / |    |    |\
               /  |    |    | \
         init /a  |d   |s   |r \ init
  
         <----------time------------>
    */
    const param = opts.param
    const peak = opts.peak || 0.8
    const hold = opts.hold || 0.6
    const time = opts.time || ctx.currentTime
    const scaler = opts.scaler || 1.0
    const a = opts.attack || 0.2 * scaler
    const d = opts.decay || 0.1 * scaler
    const s = opts.sustain || 0.1 * scaler
    const r = opts.release || 0.1 * scaler

    const initVal = param.value
    param.setValueAtTime(initVal, time)
    param.linearRampToValueAtTime(peak, time+a)
    param.linearRampToValueAtTime(hold, time+a+d)
    param.linearRampToValueAtTime(hold, time+a+d+s)
    param.linearRampToValueAtTime(initVal, time+a+d+s+r)
}

// Erratic noisy sound thing. n_oscs for number of oscillations, duration for duration
// Good for wobbly bass noise
function spazVol (gainNode, n_oscs, duration, time = ctx.currentTime) {
    var intensities = []
    for(let i = 0; i < n_oscs; i++) {
        intensities.push(Math.random())
        gainNode.linearRampToValueAtTime(intensities[i], time + i*duration/n_oscs)
    }
}

// A lot of these audio functions were copied/adapted from the video tutorials
// Most of these aren't used; I decided to use tone.js for easier interfacing
// more instruments + timbral settings and easier scheduling of notes

function playBoop(hz) {
    const synth1 = new OscillatorNode(ctx)
    const volume = new GainNode(ctx, {gain : 0.001})
    synth1.connect(volume)
    volume.connect(fft)
    volume.connect(ctx.destination)
    synth1.frequency.setValueAtTime(hz, ctx.currentTime)
    synth1.start(ctx.currentTime)
    adsr({"param": volume.gain, "scaler" : 0.2})
    synth1.stop(ctx.currentTime + 0.3)
    //document.removeEventListener('click', playMusic);
}

function vibe(freq) {
    const synth1 = new OscillatorNode(ctx)
    const volume = new GainNode(ctx, {gain : 0.001})
    synth1.connect(volume)
    volume.connect(fft)
    volume.connect(ctx.destination)
    synth1.frequency.setValueAtTime(freq, ctx.currentTime)
    synth1.start(ctx.currentTime)
    //adsr({"param": volume.gain})
    dur = 2
    freq = 30
    // weird wobbly sound
    spazVol(volume.gain, dur*freq, dur)
    synth1.stop(ctx.currentTime + dur)

    setTimeout(() => energy = 0, dur*1000)

    // create earthquake effect in p5...
}

// Modulates the frequency, like vibe but nonrandom
function modulate(hz, freq) {
    const synth = new OscillatorNode(ctx)
    const volume = new GainNode(ctx, {gain : 0.001})
    synth.connect(volume)
    volume.connect(fft)
    volume.connect(ctx.destination)
    synth.frequency.setValueAtTime(freq, ctx.currentTime)
    synth.start(ctx.currentTime)
    //adsr({"param": volume.gain})
    dur = 2
    freq = 30
    // weird wobbly sound
    spazVol(volume.gain, dur*freq, dur)
    synth1.stop(ctx.currentTime + dur)
    // create earthquake effect in p5...
}



// Stuff for p5. Ellipse size on mouse pointer
let pi = [3,1,4,1,5,9,2,6,5,3,5,8,9]
var minsize = 40
var cursize = 0
var maxsize = 160
var curBG = 0
var angle 
var dt = 0.01

// Renamed setup() which is a default p5 function to setup_p5 so we can hide it
function setupApp() {
    // Cancel speech if there's current speech going on
    window.speechSynthesis.cancel()
    user_typed = false

    // max framerate 60 for consistency across webcams
    frameRate(60);

    inputs = document.querySelectorAll('input');
    for (let i = 0; i<inputs.length; i++) {
        if (inputs[i].value !== '') {
            user_typed = true
        }
    }
    if (document.querySelector('textarea').value !== '') {
        user_typed = true;
    }

    if (!user_typed) {
        console.log("user didn't type anything but wants to vibe... LOL NO");
        return;
    }
    if (document.querySelector("canvas") == null) {
        createWaveCanvas({ element: 'section', analyser: fft});
    }

    // Change p5 code later; reinitialize the music player everytime the user clicks the button!
    c = createCanvas(800, 600)
    c.parent("p5canvas")
    setInterval(changeBG, 500);
    angle = PI
    tentacles = [] 

    capture = createCapture(VIDEO);
    capture.hide();

    // Say a welcome to the user and initialize music! msg will say the bio later...
    var greeting = "Hello, " + document.querySelector('#fname').value;

    msg = new SpeechSynthesisUtterance(greeting);
    window.speechSynthesis.speak(msg);

    var greeting2;

    age = parseInt(document.querySelector("#age").value)

    if (age < 7) {
        greeting2 = "You are a little baby."
    } else if (age < 18) {
        greeting2 = "I heard you LOVE compulsory education"
    } else if (age < 40) {
        greeting2 = "You haven't hit your midlife crisis yet."
    } else if (age < 70) {
        greeting2 = "ok boomer"
    } else if (age < 123) {
        greeting2 = "wow you are OLD."
    } else if (age > 123) {
        greeting2 = "you are either a robot or the world's oldest person."
    } else {
        greeting2 = "I don't know your age. I'll just assume you're 12."
    }

    msg = new SpeechSynthesisUtterance(greeting2);
    window.speechSynthesis.speak(msg);

    msg2 = new SpeechSynthesisUtterance("Enjoy the music!")
    window.speechSynthesis.speak(msg2);

    // Create a new poseNet method
    const poseNet = ml5.poseNet(capture, modelLoaded);
    poseNet.on('pose', function(res){
        poses = res;
        // console.log(res);
    })
    
    setTimeout((x) => startMusic(), 5000);
}

/* Performs the linear interpolation described in the mYOUsic algorithm */
function calcBPM(age) {
    var real_age = 12;

    if (typeof(age) === "number" && !isNaN(age)) {
        real_age = age;
    }

    if (real_age > 100) {
        real_age = 100;
    } else if (real_age < 0) {
        real_age = 0;
    }

    // Age will determine tempo of piece according to a piecewise linear interpolation between
    // the points (0, 80), (25, 180), (80, 70); this is to roughly match your general 
    // energy levels :) 
    if (real_age >= 0 && real_age <= 25) {
        return map(real_age, 0, 25, 80, 180);
    } else {
        return map(real_age, 25, 80, 180, 70);
    }
}



 // When the posenet model is loaded. For debug
 function modelLoaded() {
    console.log("Model Loaded!");
 }

function draw() {
    let dx, dy;

    var d = new Date();
    accum = d.getTime()/4 // accumulator variable!

    let c = color(cos(second()) * 128 + 128, sin(2 * second()) * 128 + 128, accum % 256);
    fill(c)
    cursize = map(sin(angle), -1, 1, minsize, maxsize);

    ellipse(mouseX, mouseY, sin(accum/97) * cursize, sin(accum/74) * cursize);
    if (mouseIsPressed) {
        angle += 2*PI/frameRate(); 
    }

    if (capture) {
        // Place video in center of screen
        dx = (width - capture.width)/2
        dy = (height - capture.height)/2
        tint(255, 60); // Display at 1/4 opacity for fade effect
        image(capture, dx, dy);
    }

    drawSkeleton(dx, dy);
    drawWrists(dx, dy);
    drawKeypoints(dx, dy); 
    drawParticles(particles);
    // Handle particles! destroy any particles that are off screen
}


// Stores a list of values, draws them
// TODO: probably gonna add tentacles to ragdolls for visualization purposes since
// Tentacles are pretty cool lmao
// Use push, pop!
function Tentacle(baseCoord) {
    this.base = baseCoord 
    this.offsets = [] // (dx, dy, )

}

function drawTentacles() {

}

// Initially because of chrome autoplay restrictions...
// Beep on every click adds to the computer-y terminal like theme though
document.addEventListener('mousedown', e => playBoop(220));

// Copied from https://ml5js.org/reference/api-PoseNet/ currently; will adapt to make drums
// The following comes from https://ml5js.org/docs/posenet-webcam // A function to draw ellipses over the detected keypoints
function drawKeypoints(dx = 0, dy = 0) {
    // move pen by dx, dy before drawing
    // Loop through all the poses detected
    push();
    translate(dx, dy);
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255);
                stroke(20);
                strokeWeight(4);
                ellipse(round(keypoint.position.x), round(keypoint.position.y), 8, 8);
            }
        }
    }
    pop();
}

// A function to draw the skeletons
function drawSkeleton(dx = 0, dy = 0) {
    // move pen by dx, dy before drawing
    push();
    translate(dx, dy);
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255);
            strokeWeight(1);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
    pop();
}

// maximum velocity of the left wrist!
/* 
pose: {score: 0.4921857279396671, keypoints: Array(17), nose: {…}, leftEye: {…}, rightEye: {…}, …}
skeleton: Array(3)
0: Array(2)
0:
part: "leftElbow"
position: {x: 445.63330934758767, y: 379.6665158559936}
score: 0.838269054889679
*/

// Probably a better idea to package these into an object...; didn't anticipate I'd need these
// many variables at first for this function.

// Magnitudes of velocity
var lvel = 0
var rvel = 0

// right and left wrist coordinates from last frame?
var lastRy = 0
var lastRx = 0
var lastRpresent = false // was right wrist seen in last frame?
var lastLy = 0
var lastLx = 0
var lastLpresent = false // was left wrist seen in last frame?

// Need some acceleration to play the drum; high velocity but low velocity before!
// Don't want infinite oscillating drums
var LDelay = false // Whether or not this arm can play another drum sound...
var RDelay = false

var vtrigger = 24
var minDelay = 300 // milliseconds until next drum trigger; don't want too many triggers

// Avoid namespace conflict with dist() in p5...
function eucdist(x1, y1, x2, y2) {
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
}

// Draws drumsticks on wrists! boom chacka wow wow
// Plays drum sound if you move your wrists and adds an explosion
function drawWrists(dx = 0, dy = 0) {
    // move pen by dx, dy before drawing
    push();
    translate(dx, dy);
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        let curRpresent = false;
        let curLpresent = false;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {

            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            // Elbow -> Wrist connection is the forearm
            if (partA.part === "leftElbow" || partA.part === "rightElbow") {
                if (partB.part === "leftWrist") {
                    lvel = eucdist(partB.position.x, partB.position.y, lastLx, lastLy)
                    lastLy = partB.position.y;
                    lastLx = partB.position.x;
                    curLpresent = true;
                } else if (partB.part === "rightWrist") {
                    // console.log(partB.position)
                    rvel = eucdist(partB.position.x, partB.position.y, lastRx, lastRy)
                    lastRy = partB.position.y;
                    lastRx = partB.position.x;
                    curRpresent = true;
                }
                
                // If velocity of hands is fast enough, trigger explosion + cool particle effects
                // Left hand has gravity particles, right hand doesn't!
                // Particles velocity scales with force!
                
                if (lastLpresent && lvel > vtrigger && !LDelay) {
                    LDelay = true;
                    // Particles have no gravity for left hand!
                    playDrumPow(lastLx + dx, lastLy + dy, 80, lvel/4) // send absolute coordinates since these will animate w.r.t the 

                    setTimeout(() => LDelay = false, minDelay);

                } else if (lastRpresent && rvel > vtrigger && !RDelay) {
                    RDelay = true;
                    playDrumPow(dx + lastRx, dy + lastRy, 0, rvel/4, 'G2'); // put the real x, real y which require vid offset 
                                          // send absolute coordinates since these will animate w.r.t the 
                                          // untranslated canvas!
                    setTimeout(() => RDelay = false, minDelay);
                }

                strokeWeight(15);
                stroke(255, 204, 0);

                // go PAST the second point
                let movex = partB.position.x - partA.position.x;
                let movey = partB.position.y - partA.position.y;

                lastLpresent = curLpresent;
                lastRpresent = curRpresent;

                line(partA.position.x, partA.position.y, partB.position.x + movex/2, partB.position.y + movey/2);
            }
        }
    }
    pop();
}

// TODO
// Different hands have diff particle effects!
// Play the drum at the position of x,y and make a little pow on the screen to show you played the drums
function playDrumPow(x, y, gravity = 50, force = 20, note = 'G1') {
    drum = new Tone.MembraneSynth().toMaster();
    drum.volume.value = 8 + force / 5;
    drum.triggerAttackRelease(note, "8n");

    // Add particle where hand is!
    let part = new Particle(x, y, 6 * force);
    particles.push(part);

    createExplosion(x, y, particles, gravity, force);
    return;
}