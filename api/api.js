var os = require('os');
var getos = require('getos');

console.log(`電腦名稱：${os.hostname()}`);

function getUptime(){
	var uptime = Math.floor(os.uptime());
	var uptimeD = Math.floor(uptime / 86400);
	var uptimeH = Math.floor(uptime % 86400 / 3600);
	var uptimeM = Math.floor(uptime % 3600 / 60);
	var uptimeS = uptime % 60;
	var uptimeString = '';
	uptimeString += uptimeD !== 0 ? uptimeD + '天' : '';
	uptimeString += uptimeH !== 0 ? uptimeH + '時' : '';
	uptimeString += uptimeM !== 0 ? uptimeM + '分' : '';
	uptimeString += uptimeS + '秒';
	return uptimeString;
}

function getLoadavg(){
	var loadavg = os.loadavg();
	loadavg[0] = loadavg[0].toFixed(2);
	loadavg[1] = loadavg[1].toFixed(2);
	loadavg[2] = loadavg[2].toFixed(2);
	return loadavg;
}

function getFreemem(){
	var freemem = os.freemem();
	if(freemem > 1073741824){
		freemem = (freemem/1073741824).toFixed(1) + ' GB';
	}else if(freemem > 1048576){
		freemem = Math.floor(freemem/1048576) + ' MB';
	}else if(freemem > 1024){
		freemem = Math.floor(freemem/1024) + ' KB';
	}else{
		freemem = freemem + ' Bytes';
	}
	return freemem;
}

	getos((e, os) => {
		console.log(JSON.stringify(os));
	})


console.log(`開機時間：${getUptime()}`);
console.log(`CPU 平台：${os.arch()}`);
console.log(`CPU 型號：${os.cpus()[0].model}`);
console.log(`CPU 核心：${os.cpus().length}核心`);
console.log(`RAM 可用：${getFreemem()}`);
console.log(`電腦負載：${getLoadavg()}`);
console.log(`作業系統：${os.platform()}`);