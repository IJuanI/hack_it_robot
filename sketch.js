/// <reference path="../TSDef/p5.global-mode.d.ts" />

const ENABLE_CONTROLLERS = true;

// global vars
const degToRad = Math.PI / 180;
let width = 600, height = 300;
let centerX, centerY;
let rotCenter;

// Animation vars
let startTime = 0;
let currTime = 0;

// Editable vars
let knots = [
	{ angle: 90.43, length: 0.78 },
	{ angle: 84.09, length: .91 }
];

function setup()
{
	//create a canvas for the robot
	createCanvas(width, height);
	centerX = width / 2;
	centerY = height / 2;
	startTime = new Date().getTime() / 1000;
}

function draw()
{
	clear();
	currTime = new Date().getTime()/1000 - startTime;

	// animations
	const minRot = 0, maxRot = 25;
	const rotation = [
		tlerp(3, 3.2, minRot, maxRot)
		+ tlerp(3.5, 3.7, 0, -maxRot)
		+ tlerp(3.9, 4.1, minRot, maxRot)
		+ tlerp(4.2, 4.4, 0, -maxRot)
		+ tlerp(4.5, 4.7, minRot, maxRot)
		+ tlerp(4.8, 5.0, 0, -maxRot),
		tlerp(2, 2.2, minRot, maxRot)
		+ tlerp(2.5, 2.7, 0, -maxRot)
		+ tlerp(3.9, 4.1, minRot, maxRot)
		+ tlerp(4.2, 4.4, 0, -maxRot)
		+ tlerp(4.5, 4.7, minRot, maxRot)
		+ tlerp(4.8, 5.0, 0, -maxRot)
	];

	const minIrisRad = 25, maxIrisRad = 45;
	const irisRadius = [
		45
		+ tlerp(0.2, 0.45, 0, (minIrisRad - maxIrisRad))
		+ tlerp(0.75, 1.0, 0, (maxIrisRad - minIrisRad)),
		45
		+ tlerp(1.10, 1.35, 0, (minIrisRad - maxIrisRad))
		+ tlerp(1.65, 1.9, 0, (maxIrisRad - minIrisRad))
	];
	
	// draw the robot
	noStroke();
	drawNose({ noseWidth: 50, noseHeight: 90, noseElevation: 0.675 });
	rotCenter = [centerX, height * (1 - 0.675)]; // Rotate around nose
	drawEyesFrame({
		baseElevation: 0.725, frameSeparation: 45,
		eyeBoxHeight: 110, eyeBoxWidth: 220,
		frameWeight: 15, arcSpan: 75,
		knots, rotation });
	
	// compute eye rotation
	const eyeSeparation = 225, eyeElevation = 0.71;
	const eyeBasePos = [centerX - eyeSeparation / 2, height * (1 - eyeElevation)];
	const eyesPos = rotation.reverse().map(rot => applyRotation(eyeBasePos, rotCenter, -rot));
	const eyeOffset = [eyesPos[0][0] - centerX, eyesPos[1][0] - centerX];
	const eyeHeight = [eyesPos[0][1], eyesPos[1][1]];
	drawEyes({ irisRadius, corneaRadius: 50, eyeOffset, eyeHeight });

	if (currTime > 10) {
		startTime = new Date().getTime() / 1000;
	}
}

// Drawing functions

function drawEyes({ irisRadius, corneaRadius, eyeOffset, eyeHeight })
{
	let diameter;

	// Wall-E has two eyes
	for (let i = -1; i <= 1; i += 2)
	{
		// Eyes are independent on each one another
		const eyePosY = eyeHeight[i === -1 ? 0 : 1];
		const currOffset = eyeOffset[i === -1 ? 0 : 1];
		const irisRad = irisRadius[i === -1 ? 0 : 1];
		const corneaDiameter = corneaRadius * 2;
		const baseDiameter = irisRad * 2;

		// cornea
		fill(104, 37, 97); // shadow
		ellipse(centerX + i*currOffset + 1, eyePosY+4, diameter = corneaDiameter+2, diameter);
		fill(150, 95, 138); // base
		ellipse(centerX + i*currOffset, eyePosY+1, diameter = corneaDiameter, diameter);

		// iris
		fill(54, 18, 57);
		ellipse(centerX + i*currOffset, eyePosY, diameter = baseDiameter, diameter);
	
		// pupil (and it's reflex)
		let pupilOffset, pupilDiameter, pupilElevation = 0.72;
		let reflexOffset, reflexDiameter, reflexElevation;
		if (i == -1) {
			[pupilOffset, pupilDiameter] = [.15, 26];
			[reflexOffset, reflexDiameter, reflexElevation] = [.55, 14, .5];
		} else {
			[pupilOffset, pupilDiameter] = [.1, 24];
			[reflexOffset, reflexDiameter, reflexElevation] = [.4, 12, .575];
		}

		fill(220, 229, 202);
		ellipse(centerX + i*(currOffset + irisRad*pupilOffset),
			eyePosY + irisRad * (1-pupilElevation*2), diameter = pupilDiameter, diameter);
		fill(165, 161, 154);
		ellipse(centerX + i*currOffset - irisRad*reflexOffset,
			eyePosY + irisRad * (1-reflexElevation*2), diameter = reflexDiameter, diameter);
	}
}

// I was trying to keep it simple, but curves got a little out of hand...
function drawEyesFrame({ baseElevation, frameSeparation, eyeBoxHeight, eyeBoxWidth, frameWeight, arcSpan, knots, rotation })
{
	const posX = centerX - frameSeparation / 2;
	const posY = height * (1 - baseElevation);

	const p1 = [posX, posY - eyeBoxHeight/2];
	const p2 = [posX - eyeBoxWidth + arcSpan, posY - eyeBoxHeight/2];
	const p3 = [posX - eyeBoxWidth, posY - eyeBoxHeight / 2 + arcSpan];

	const dir = mul([p3[1] - p2[1], p2[0] - p3[0]], .5);
	const openness = .5 * Math.pow(arcSpan, 2) / sqrLen(dir);
	const arcRadius = Math.sqrt(sqrLen(dir) * (1 + Math.pow(openness, 2)));
	const c0 = add(mul(add(p2, p3), .5), mul(dir, openness));

	const arcTo = (c, p) => angle([1, 0], diff(c, p));
	const frameDim = (eyeBoxWidth + eyeBoxHeight) / 2;
	const calcKnot = (base, knot) => add(base, mul([cos(knot.angle * degToRad), sin(knot.angle * degToRad)], knot.length * frameDim));
	const k0 = calcKnot(p3, knots[0]);
	const k1 = calcKnot(p1, knots[1]);

	const condFlipX = (doFlip, values) => doFlip ? values.map(([x, y]) => [width-x, y]) : values;
	// Drawing two frames mirrored
	for (let i = 0; i < 2; i++)
	{
		const rotAngle = rotation[i] * (i === 0 ? -1 : 1);
		const [ _c0, sk0, sk1 ] = condFlipX(i === 1, [c0, k0, k1]);
		const [ bp1, bp2, bp3 ] = condFlipX(i === 1, [p1, p2, p3]);
		const rc0 = applyRotation(_c0, rotCenter, rotAngle);

		// Metal frame
		const [ fp1, fp2, fp3 ] = condFlipX(i === 1, [[p1[0]+frameWeight, p1[1]-frameWeight], [p2[0], p2[1]-frameWeight], [p3[0]-frameWeight, p3[1]]]);
		const fk0 = add(fp3, mul(add(sk0, mul(bp3, -1)), 1.2)),
			  fk1 = add(fp1, mul(add(sk1, mul(bp1, -1)), 1.2));
		if (i === 0) fill(116, 54, 111);
		else fill(216, 150, 109);
		bezier(...[fp3, fk0, fk1, fp1].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]));
		if (i === 0) fill(235, 207, 180);
		else fill(116, 54, 111);
		arc(...rc0, (arcRadius+frameWeight)*2, (arcRadius+frameWeight)*2,
			arcTo(rc0, applyRotation(i === 0 ? fp3 : fp2, rotCenter, rotAngle)),
			arcTo(rc0, applyRotation(i === 0 ? fp2 : fp3, rotCenter, rotAngle)));
		quad(...[fp1, bp1, fp3, fp2].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]));
		
		// Eye backdrop
		fill(54, 20, 54);
		triangle(...[bp1, bp2, bp3].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]));
		triangle(...[bp1, bp2].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]), ...rc0);
		arc(...rc0, arcRadius*2, arcRadius*2,
			arcTo(rc0, applyRotation(i === 0 ? bp3 : bp2, rotCenter, rotAngle)),
			arcTo(rc0, applyRotation(i === 0 ? bp2 : bp3, rotCenter, rotAngle)));
		bezier(...[bp3, sk0, sk1, bp1].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]));
		
		// Eye sclera
		fill(210, 208, 195);
		const sArcOffsetY = frameWeight*(i === 0 ? .5 : .3);
		const sArcOffsetX = frameWeight*(i === 0 ? .3 : 0);
		const [ sp1, sp2, sp3 ] = [ [ i === 0 ? bp1[0] : bp1[0] + frameWeight*.75, bp1[1] + frameWeight*.65 ], [bp2[0], bp2[1] + sArcOffsetY], [bp3[0] + sArcOffsetX, bp3[1]] ];
		triangle(...[sp1, sp2, sp3].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]));
		triangle(...[sp1, sp2].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]), ...rc0);
		arc(...rc0, (arcRadius - sArcOffsetX)*2, (arcRadius - sArcOffsetY)*2,
			arcTo(rc0, applyRotation(i === 0 ? bp3 : sp2, rotCenter, rotAngle)),
			arcTo(rc0, applyRotation(i === 0 ? sp2 : bp3, rotCenter, rotAngle)));
		bezier(...[sp3, sk0, sk1, sp1].map(p => applyRotation(p, rotCenter, rotAngle)).flatMap(p => [...p]));
	}

	if (ENABLE_CONTROLLERS) {
		// Control points
		fill(30, 30, 220);
		ellipse(k0[0], k0[1], 7, 7);
		ellipse(k1[0], k1[1], 7, 7);

		// Cursor pointers
		if (dist(mouseX, mouseY, k0[0], k0[1]) < 15 || dist(mouseX, mouseY, k1[0], k1[1]) < 15) {
			cursor(HAND);
		} else {
			cursor(ARROW);
		}

		// Controllers interaction
		if (mouseIsPressed) {
			if (dist(mouseX, mouseY, k0[0], k0[1]) < 15) {
				knots[0].length = Math.sqrt(sqrLen(diff(p3, [mouseX, mouseY]))) / frameDim;
				knots[0].angle = arcTo(p3, [mouseX, mouseY]) / degToRad;
			} else if (dist(mouseX, mouseY, k1[0], k1[1]) < 15) {
				knots[1].length = Math.sqrt(sqrLen(diff(p1, [mouseX, mouseY]))) / frameDim;
				knots[1].angle = arcTo(p1, [mouseX, mouseY]) / degToRad;
			}
		}
	}
}

function drawNose({ noseWidth, noseHeight, noseElevation })
{
	const posX = centerX;
	const posY = height * (1 - noseElevation);
	const capHeight = noseWidth / 2;
	const rHeight = noseHeight - capHeight * 2;

	// Nose base
	fill(150, 71, 101);
	rect(posX - noseWidth / 2, posY - rHeight / 2, noseWidth, rHeight);
	arc(posX, posY-rHeight/2+1, noseWidth, capHeight*2, PI, 2*PI);
	arc(posX, posY+rHeight/2-1, noseWidth, capHeight*2, 0, PI);
	stroke(91, 35, 72).strokeCap(SQUARE).strokeWeight(3).line(posX - noseWidth / 2, posY-1, posX + noseWidth / 2, posY-1);
	stroke(152, 87, 108).strokeCap(SQUARE).strokeWeight(2).line(posX - noseWidth / 2, posY+1, posX + noseWidth / 2, posY+1);
	noStroke();

	// Nose shadow
	fill(110, 43, 96);
	rect(posX, posY - rHeight / 2, noseWidth/2, rHeight);
	arc(posX, posY-rHeight/2+1, noseWidth, capHeight*2, 3/2*PI, 2*PI);
	arc(posX, posY+rHeight/2-1, noseWidth, capHeight*2, 0, PI/2);
	stroke(87, 32, 72).strokeCap(SQUARE).strokeWeight(3).line(posX, posY-1, posX + noseWidth / 2, posY-1);
	stroke(128, 72, 106).strokeCap(SQUARE).strokeWeight(2).line(posX, posY+1, posX + noseWidth / 2, posY+1);
	noStroke();

	// fill(30, 30, 220);
	// ellipse(posX + noseWidth / 2, posY, 7, 7);
}

// Animation functions

function tlerp(tStart, tEnd, vFrom, vTo, vInit = vFrom, vEnd = vTo) {

	const t = (currTime - tStart) / (tEnd - tStart);
	if (t > 1)  return vEnd;
	if (t < 0) return vInit;
	return vFrom * (1 - t) + vTo * t;
}

// Algebraic functions

function applyRotation(p, center, angle) {
	const localP = diff(center, p);
	const c = cos(angle*degToRad), s = sin(angle*degToRad);
	const rotatedP = [
		dot(localP, [c, -s]),
		dot(localP, [s, c])
	];
	return add(rotatedP, center);
}

function dot(p0, p1) {
	return p0[0] * p1[0] + p0[1] * p1[1];
}

function vMul(p0, p1) {
	return [p0[0] * p1[0], p0[1] * p1[1]];
}

function add(p0, p1) {
	return [p0[0] + p1[0], p0[1] + p1[1]];
}

function mul(p, n) {
	return [p[0]*n, p[1]*n];
}

function diff(p0, p1) {
	return [p1[0] - p0[0], p1[1] - p0[1]];
}

function sqrLen(p) {
	return p[0]*p[0] + p[1]*p[1];
}

function angle(p0, p1) {
	return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}