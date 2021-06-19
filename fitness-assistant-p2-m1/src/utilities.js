
export function drawKeypoints(ctx, point, color){
    const radius = 2;
    const colorToUse =  color || 'red';

    ctx.fillStyle = colorToUse;
    ctx.beginPath();
    ctx.arc(point.position.x, point.position.y, radius, 0, 2 * Math.PI);
    ctx.fill();
}

const skeletonParts = [
    "Wrist",
    "Elbow",
    "Shoulder",
    "Hip",
    "Knee",
    "Ankle",
    
];

const sides = ['left', 'right'];

const MIN_SCORE = .8;

export function drawSkeleton(ctx, pose){

    const radius = 2;
    const color =  'blue';

    const points = pose.keypoints;

    

    for(let side of sides){
        let firstPoint = true;
        for(let part of skeletonParts){
            let point = points.find( x=> x.part == side + part);

            if( point.score > MIN_SCORE){
                if(firstPoint ) {
                    firstPoint = false;
                    ctx.beginPath();
                    ctx.moveTo (point.position.x, point.position.y)
                } else{
                    ctx.lineTo (point.position.x, point.position.y)
                }
                //drawKeypoints(ctx, point, color);
            }
        }
        ctx.stroke();
    }

    let rightShoulder = points.find(x=>x.part == 'rightShoulder');
    let leftShoulder = points.find(x=>x.part == 'leftShoulder');
    let leftHip = points.find(x=>x.part == 'leftHip');
    let rightHip = points.find(x=>x.part == 'rightHip');

    if( rightHip && rightShoulder && leftShoulder && leftHip){
        ctx.beginPath();
        ctx.moveTo(rightHip.position.x, rightHip.position.y);
        ctx.lineTo(rightShoulder.position.x, rightShoulder.position.y);
        ctx.lineTo(leftShoulder.position.x, leftShoulder.position.y);
        ctx.lineTo(leftHip.position.x, leftHip.position.y);
        ctx.closePath();
        ctx.stroke();  
    }
}