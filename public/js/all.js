$(document).ready(function() {
	function load(){
		setTimeout(function(){
			$('#loader').fadeOut('slow/400/fast');
			$('.content').css('display', 'block');
		}, 500);
	}
	load();

	function isEmail(email) {
		var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		return regex.test(email);
	}

	function getManchineInfo(machineIP, callback) {
		var data = JSON.stringify({ip: machineIP});
		$.ajax({
			url: '/machine',
			type: 'GET',
			dataType: 'application/json; charset=utf-8',
			data: {ip: machineIP},
			complete: function(jqXHR, textStatus) {
				var machineInfo = $.parseJSON(jqXHR.responseText);
				var response = machineInfo.result;
				callback(response, machineInfo);
			}
		});
	}

	function getUptime(a){
		var uptime = Math.floor(a);
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

	function appendMachineTable() {
		$.ajax({
			url: '/machines',
			type: 'GET',
			complete: function(jqXHR, textStatus) {
				var response = $.parseJSON(jqXHR.responseText).result;
				var machines = $.parseJSON(jqXHR.responseText).machines;
				if (response === 0) {
					for (var i = 0; i < machines.length; i++) {
						var machineInfoURL = "machineInfo?ip=" + machines[i].ip + "&name=" + machines[i].name;
						$('#machinesTable > tbody:last-child').append(
						"<tr>"+
							"<td class='text-center'>" + "<a href='" + machineInfoURL + "' class='btn btn-info'>"+"<i class='fa fa-eye'></i>" + "</a>" + "</td>" +
							"<td class='text-center'>" + machines[i].name + "</td>" +
							"<td>" + machines[i].ip + "</td>" +
							"<td>" + "<button type='button' data-ip='" + machines[i].ip + "' class='btn btn-primary'>修改</button>" + "</td>" +
							"<td>" + "<button type='button' data-ip='" + machines[i].ip + "' class='btn btn-danger'>刪除</button>" + "</td>" +
						"</tr>"
						);
					}
				}
			}
		});
	}

	if ($(location)[0].pathname === '/') {
		appendMachineTable();
	};

	setInterval(function(){
		if ($(location)[0].pathname === '/machineInfo') {
			var urlSearch = $(location)[0].search;
			var machineIP = urlSearch.split('&')[0].split('=')[1];
			getManchineInfo(machineIP, function(response, machineInfo) {
					$('#OS').text("OS:");
					$('#upTime').text("UpTime:");
					$('#cpuUsage').text("CPU Usage:");
					$('#cpuPlatform').text("CPU Platform:");
					$('#cpuModel').text("CPU Model:");
					$('#cpuCores').text("CPU Cores:");
					$('#load').text("Load:");
					$('#freemem').text("Freemem:");
					$('#mac').text("MAC:");
					if (response !== 0) {
						$('#alertHeader').text('Warning');
						$('#alertMessage').find('p').text("Your Machine is Dead, ASshole");
						$('#alert').modal('show');
						return false;
					}
					if (response === 0) {
						$('#OS').append(machineInfo.os);
						$('#upTime').append(getUptime(machineInfo.uptime));
						$('#cpuUsage').append(machineInfo.cpu_usage + '%');
						$('#cpuPlatform').append(machineInfo.cpu_platform);
						$('#cpuModel').append(machineInfo.cpu_model);
						$('#cpuCores').append(machineInfo.cpu_cores);
						$('#load').append(machineInfo.load[0] + ', ' + machineInfo.load[1] + ', ' + machineInfo.load[2]);
						$('#freemem').append(machineInfo.freemem);
						$('#mac').append(machineInfo.mac);
						return false;
					}
			});
		}
	},1000);

	$('#machineInfoNavBar').on('click', 'li', function(event) {
		event.preventDefault();
		$('#machineInfoNavBar').find('.active').removeClass('active');
		$(this).addClass('active');
	});

	// 你們看這裡就好，有問題密我
	$('#machineInfoNavBar').on('click', '#machineChartButton', function() {
		$('#machineInfoContent').empty();
		$('#machineInfoContent').append("<div id='graph' class='aGraph'></div>");
		$('#machineInfoContent').append("<style>path {stroke: steelblue;stroke-width: 2;fill: none;}.axis {shape-rendering: crispEdges;}.x.axis line {stroke: lightgrey;}.x.axis .minor {stroke-opacity: .5;}.x.axis path {display: none;}.y.axis line, .y.axis path {fill: none;stroke: #000;}</style>");

		var urlSearch = $(location)[0].search;
		var machineIP = urlSearch.split('&')[0].split('=')[1];
		setInterval(function() {
			getManchineInfo(machineIP, function(response, machineInfo){
				console.log(machineInfo.cpu_usage);
			});
		}, 1000);
		var data = [];
		var count = 0;
		function render(data){
  			document.getElementById("graph").innerHTML = "";
			var m = [80, 80, 80, 80]; // margins
			var w = 1000 - m[1] - m[3]; // width
			var h = 400 - m[0] - m[2]; // height


			var x = d3.scale.linear().domain([0+count, data.length+count]).range([0, w]);
			var y = d3.scale.linear().domain([0, 100]).range([h, 0]);
			var line = d3.svg.line()
				.x(function(d,i) {
					return x(i+count);
				})
				.y(function(d) {
					return y(d);
				})

				var graph = d3.select("#graph").append("svg:svg")
				      .attr("width", w + m[1] + m[3])
				      .attr("height", h + m[0] + m[2])
				    .append("svg:g")
				      .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

				var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(true);
				graph.append("svg:g")
				      .attr("class", "x axis")
				      .attr("transform", "translate(0," + h + ")")
				      .call(xAxis);


				var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("left");
				graph.append("svg:g")
				      .attr("class", "y axis")
				      .attr("transform", "translate(-25,0)")
				      .call(yAxisLeft);

	  			graph.append("svg:path").attr("d", line(data));
  			}

  			function add(a){
          if(data.length>30){
  				data.shift();
          }
  				data.push(a);
  				count++;
  				render(data);
  			}
  			setInterval(function(){
  			getManchineInfo(machineIP, function(response, machineInfo){
				add(machineInfo.cpu_usage);
			});
  			}, 1000);

	});

	// $('#machinesTable').on('click', '#displayMachineInfo', function(event) {
	// 	event.preventDefault();
	// 	var ip = $(this).data('ip');
	// 	getManchineInfo(ip, function(response, machineInfo) {
	// 		// machineInfo = $.parseJSON(machineInfo);
	// 		$('#machineInfoHeader').text("Machine Information");
	// 		$('#machineInfoMessage').find('p').text(machineInfo);
	// 		$('#machineInfo').modal('show');
	// 		return false;
	// 	});
	// });

	$('#loginButton').on('click', function(event) {
		event.preventDefault();
		var email = $('input[name=email]').val();
		var password = $('input[name=password]').val();

		if (email == '' || password == '') {
			$('#alertHeader').text('Warning');
			$('#alertMessage').find('p').text("Email and password can't be empty");
			$('#alert').modal('show');
			return false;
		}

		if(isEmail(email) === false){
			$('#alertHeader').text('Warning');
			$('#alertMessage').find('p').text("Invalid Email");
			$('#alert').modal('show');
			return false;
		}

		var data = JSON.stringify({email: email, password: sha256(password)});
		$.ajax({
	        url: '/login',
	        type: 'POST',
	        data: data,
	        contentType: 'application/json; charset=utf-8',
	        dataType: "json",
	        complete: function(jqXHR, textStatus) {
	        	var response = $.parseJSON(jqXHR.responseText).result;
	        	if (response === -1) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Email or password is incorrect");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === -999) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Database Error");
					$('#alert').modal('show');
					return false;
	        	}

	        	if(response === 0) {
	        		$(location).attr('href', '/');
	        	}
	        }
    	});

	});

	$('#logoutLink').on('click', function(event) {
		event.preventDefault();
		$.ajax({
			url: '/logout',
			type: 'POST',
			dataType: 'application/json; charset=utf-8',
			data: {},
			complete: function(jqXHR, textStatus) {
				var response = $.parseJSON(jqXHR.responseText).result;
				if (response === 0) {
					$(location).attr('href', '/login');
				}
			}
		});
	});

	$('#registerButton').on('click', function(event) {
		event.preventDefault();
		var email = $('input[name=email]').val();
		var password = $('input[name=password]').val();
		var passwordCheck = $('input[name=passwordCheck]').val();

		if (email == '' || password == '' || passwordCheck=='') {
			$('#alertHeader').text('Warning');
			$('#alertMessage').find('p').text("Email and password can't be empty");
			$('#alert').modal('show');
			return false;
		}

		if(isEmail(email) === false){
			$('#alertHeader').text('Warning');
			$('#alertMessage').find('p').text("Invalid Email");
			$('#alert').modal('show');
			return false;
		}

		if (password !== passwordCheck) {
			$('#alertHeader').text('Warning');
			$('#alertMessage').find('p').text("Password and Password Check must be the same");
			$('#alert').modal('show');
			return false;
		}

		var data = JSON.stringify({email: email, password: sha256(password)})

		$.ajax({
	        url: '/register',
	        type: 'POST',
	        data: data,
	        contentType: 'application/json; charset=utf-8',
	        dataType: "json",
	        complete: function(jqXHR, textStatus) {
	        	var response = $.parseJSON(jqXHR.responseText).result;
	        	if (response === -1) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Your information type is incorrect");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === -2) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("This is Email have been registered");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === -999) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Database Error");
					$('#alert').modal('show');
					return false;
	        	}

	        	if(response === 0) {
        			$(location).attr('href', '/login');
	        	}
	        }
    	});
	});

	$('#openAddMachineButton').on('click', function() {
		$('#addMachineForm').modal('show');
	});

	$('#addMachineButton').on('click', function() {
		var machineIp = $('input[name=machine-ip]').val();
		var machineName = $('input[name=machine-name]').val();
		var data = JSON.stringify({ip: machineIp, name: machineName});
		$.ajax({
	        url: '/machine',
	        type: 'POST',
	        data: data,
	        contentType: 'application/json; charset=utf-8',
	        dataType: "json",
	        complete: function(jqXHR, textStatus) {
	        	var response = $.parseJSON(jqXHR.responseText).result;
	        	if (response === -1) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Your IP type is incorrect");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === -2) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("This machine is existed");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === -3) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("This machine doesn't response");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === -998) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("User isn't login");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === -999) {
	        		$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Database Error");
					$('#alert').modal('show');
					return false;
	        	}

	        	if (response === 0) {
	        		$('#alertHeader').text('Success');
					$('#alertMessage').find('p').text("Machine Added!");
					$('#alert').modal('show');
					$('#machinesTable > tbody').empty();
					appendMachineTable();
					return false;
	        	}
	        }
        });
	});

});