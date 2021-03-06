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
	function getMachineInfo(machineIP, callback) {
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

	function isOnline(ip, view){
		getMachineInfo(ip, function(response){
			if(response === 0){
				$(view).html('<span class="online">●</span>');
			}else{
				$(view).html('<span class="offline">✘</span>');
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
		uptimeString += uptimeD !== 0 ? uptimeD + 'd' : '';
		uptimeString += uptimeH !== 0 ? uptimeH + 'h' : '';
		uptimeString += uptimeM !== 0 ? uptimeM + 'm' : '';
		uptimeString += uptimeS + 's';
		return uptimeString;
	}

	function getFreemem(a){
		if(a > 1073741824){
			a = (a/1073741824).toFixed(1) + ' GB';
		}else if(a > 1048576){
			a = Math.floor(a/1048576) + ' MB';
		}else if(a > 1024){
			a = Math.floor(a/1024) + ' KB';
		}else{
			a = a + ' Bytes';
		}
		return a;
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
						var machineInfoURL = "machineInfo?ip=" + machines[i].ip + "&name=" + escapeHtml(machines[i].name);
						$('#machinesTable > tbody:last-child').append(
						"<tr>"+
							"<td class='text-center'>" + "<a href='" + machineInfoURL + "' class='btn btn-info'>"+"<i class='fa fa-eye'></i>" + "</a>" + "</td>" +
							"<td class='text-center'>" + escapeHtml(machines[i].name) + "</td>" +
							"<td>" + machines[i].ip + "</td>" +
							"<td class='text-center status'><i class='fa fa-spinner fa-spin'></i></td>" + 
							"<td>" + "<button type='button' data-ip='" + machines[i].ip + "' class='btn btn-primary editMachineButton'>Edit</button>" + "</td>" +
							"<td>" + "<button type='button' data-ip='" + machines[i].ip + "' class='btn btn-danger deleteMachineButton'>Delete</button>" + "</td>" +
						"</tr>");
						isOnline(machines[i].ip, $('.status')[i]);
					}
				}
			}
		});
	}

	function notifyMe(msg, title, url) {
		if (Notification.permission !== "granted"){
			Notification.requestPermission();
		} else {
			var notification = new Notification(title, {
				icon: '/public/img/logo.png',
				body: msg,
			});

			if(url){
				notification.onclick = function () {
					window.open("");
				};
			}

		}
	}

	function escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	if ($(location)[0].pathname === '/') {
		appendMachineTable();
		if (Notification.permission !== "granted"){
			Notification.requestPermission();
		}
	};

	if ($(location)[0].pathname === '/machineInfo') {


		var urlSearch = $(location)[0].search;
		var machineIP = urlSearch.split('&')[0].split('=')[1];

		var time = Date.now() / 1000 | 0;
		var dataCPU = [];
		var dataFreemem = [];
		var count = 0;

		$('#machineGraphContent').hide();
		var intervalBasicInfo = setInterval(function(){
			getMachineInfo(machineIP, function(response, machineInfo) {
				if (response === -1 || response === -3) {
					$('#alertHeader').text('Warning');
					$('#alertMessage').find('p').text("Your Machine is Dead, ASshole");
					$('#alert').modal('show');
					intervalBasicInfo = null;
				} else if(response === -2) {
					$('#alertHeader').text('Warning');
					$('#alertMessage').find('p').text("Is that your machine?");
					$('#alert').modal('show');
					intervalBasicInfo = null;
				}else {
					var urlSearch = $(location)[0].search;
					var machineIP = urlSearch.split('&')[0].split('=')[1];


						$('#OS').text(machineInfo.os);
						$('#upTime').text(getUptime(machineInfo.uptime));
						$('#cpuUsage').text(machineInfo.cpu_usage + '%');
						$('#cpuPlatform').text(machineInfo.cpu_platform);
						$('#cpuModel').text(machineInfo.cpu_model);
						$('#cpuCores').text(machineInfo.cpu_cores);
						$('#load').text(machineInfo.load[0] + ', ' + machineInfo.load[1] + ', ' + machineInfo.load[2]);
						$('#freemem').text(getFreemem(machineInfo.freemem));
						$('#mac').text(machineInfo.mac);

						var yAxisCPU = function(d){
							return d+'%';
						};

						var yAxisFreemem = function(d){
							if(d > 1048576){
								return `${d/1000000} GB`;
							}else{
								return `${d/1000} MB`;
							}
						};

						count++;
						render('graphCPU', machineInfo.cpu_usage, dataCPU, count, time, yAxisCPU);
						render('graphFreemem', machineInfo.freemem/1024, dataFreemem, count, time, yAxisFreemem);
				}
			});
		}, 1000);

		$('#machineInfoNavBar').on('click', 'li', function(event) {
			event.preventDefault();
			$('#machineInfoNavBar').find('.active').removeClass('active');
			$(this).addClass('active');
		});

		$('#machineInfoNavBar').on('click', '#machineBaicInfoButton', function() {
			$('.page').hide();
			$('#machineInfoContent').show();
		});
		$('#machineInfoNavBar').on('click', '#machineChartButton', function() {
			$('.page').hide();
			$('#machineGraphContent').show();
		});

		function render(view, value, data, count, time, yAxisFormat){
			if(data.length>30){
				data.shift();
			}
			data.push(value);

			document.getElementById(view).innerHTML = "";
			var m = [80, 80, 80, 80]; // margins
			var w = 1000 - m[1] - m[3]; // width
			var h = 400 - m[0] - m[2]; // height

			var max_data = 0;
			for(var i=0;i<data.length;i++) if(data[i]>max_data) max_data = data[i];

			var x = d3.scale.linear().domain([0+count, data.length+count]).range([0, w]);
			var y = d3.scale.linear().domain([0, max_data || 1]).range([h, 0]);
			var line = d3.svg.line()
				.x(function(d,i) {
					return x(i+count);
				})
				.y(function(d) {
					return y(d);
				})

			var graph = d3.select("#" + view).append("svg:svg")
				  .attr("width", w + m[1] + m[3])
				  .attr("height", h + m[0] + m[2])
				.append("svg:g")
				  .attr("transform", "translate(" + m[3] + "," + m[0] + ")")


			var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(true).tickFormat(function(d){
				var now = new Date((time + d)*1000).toTimeString().split(' ')[0].split(':');
				return `${now[1]}m${now[2]}s`
			});

			graph.append("svg:g")
				  .attr("class", "x axis")
				  .attr("transform", "translate(0," + h + ")")
				  .call(xAxis);
				  
			var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("left").tickFormat(yAxisFormat)
			graph.append("svg:g")
				  .attr("class", "y axis")
				  .attr("transform", "translate(-25,0)")
				  .call(yAxisLeft);

			graph.append("svg:path").attr("d", line(data));

		}

		// $('#machinesTable').on('click', '#displayMachineInfo', function(event) {
		// 	event.preventDefault();
		// 	var ip = $(this).data('ip');
		// 	getMachineInfo(ip, function(response, machineInfo) {
		// 		// machineInfo = $.parseJSON(machineInfo);
		// 		$('#machineInfoHeader').text("Machine Information");
		// 		$('#machineInfoMessage').find('p').text(machineInfo);
		// 		$('#machineInfo').modal('show');
		// 		return false;
		// 	});
		// });
	}

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

		$(this).html('<i class="fa fa-spinner fa-spin"></i>');

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
					$('#loginButton').text('Login');
					return false;
				}

				if (response === -999) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Database Error");
					$('#alert').modal('show');
					$('#loginButton').text('Login');
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

	$('#openUpdateUserForm').on('click', function(event) {
		event.preventDefault();
		email = $(this).data('email');
		$('#doUpdateUserButton').data('email', email);
	    $('#editUserForm').modal('show');
	});

	$('#editUserForm').on('click', '#doUpdateUserButton', function(event) {
		event.preventDefault();
		$('#editUserForm').modal('hide');
		var email = $(this).data('email');
		var oldPassword = $("input[name='old-password']").val();
		var newPassword = $("input[name='new-password']").val();
		var newPasswordCheck = $("input[name='new-password-check']").val();

		if (!oldPassword || !newPassword || !newPasswordCheck) {
			oldPassword = $("input[name='old-password']").val('');
			newPassword = $("input[name='new-password']").val('');
			newPasswordCheck = $("input[name='new-password-check']").val('');
			$('#alertHeader').text('Error');
			$('#alertMessage').find('p').text("All inputs can not be emtpy");
			$('#alert').modal('show');
			return false;
		}

		else if (newPassword !== newPasswordCheck) {
			oldPassword = $("input[name='old-password']").val('');
			newPassword = $("input[name='new-password']").val('');
			newPasswordCheck = $("input[name='new-password-check']").val('');
			$('#alertHeader').text('Error');
			$('#alertMessage').find('p').text("Password doesn't match the confirmation");
			$('#alert').modal('show');
			return false;
		}

		else {
			var oldPassword = sha256(oldPassword);
			var newPassword = sha256(newPassword);
			$.ajax({
				url: '/user',
				type: 'PUT',
				dataType: 'application/json; charset=utf-8',
				data: {email: email, oldpassword: oldPassword, newpassword: newPassword},
				complete: function(jqXHR, textStatus) {
					var response = $.parseJSON(jqXHR.responseText).result;

					if (response === -1) {
						$('#alertHeader').text('Error');
						$('#alertMessage').find('p').text("Old password is wrong");
						$('#alert').modal('show');
					}

					else if (response === -998) {
						$('#alertHeader').text('Error');
						$('#alertMessage').find('p').text("User doesn't login");
						$('#alert').modal('show');
					}

					else if (response === -999) {
						$('#alertHeader').text('Error');
						$('#alertMessage').find('p').text("Database Error");
						$('#alert').modal('show');
					}

					else if (response === 0) {
						$('#alertHeader').text('Success');
						$('#alertMessage').find('p').text("Passord Changed!");
						$('#alert').modal('show');
					}
				}
			});
		}

	});

	$('#openAddMachineButton').on('click', function() {
		$('#addMachineForm').modal('show');
	});

	$('#addMachineButton').on('click', function(event) {
		event.preventDefault();
		$('#addMachineForm').modal('hide');
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
					$('#alertMessage').find('p').text("Your IP type is incorrect.");
					$('#alert').modal('show');
				}

				else if (response === -2) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("This machine has been registered.");
					$('#alert').modal('show');
				}

				else if (response === -3) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("This machine doesn't response.");
					$('#alert').modal('show');
				}

				else if (response === -998) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("User doesn't login");
					$('#alert').modal('show');
					return false;
				}

				else if (response === -999) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Database Error");
					$('#alert').modal('show');
				}

				else if (response === 0) {
					$('#alertHeader').text('Success');
					$('#alertMessage').find('p').text("Machine Added!");
					$('#alert').modal('show');
					$('#machinesTable > tbody').empty();
					appendMachineTable();
				}
			}
		});
	});
	$('body').on('click', '.goHome', function(){
		location.href = '/';
	});

	$('#machinesTable').on('click', '.deleteMachineButton', function(event) {
		event.preventDefault();
		ip = $(this).data('ip');
		$('#confirmDeleteMachine').data('ip', ip);
		$('#checkDeleteMachineHeader').html('<b>Are you sure?</b>');
		$('#checkDeleteMachineMessage').text('Do you want to delete this machine?');
		$('#checkDeleteMachine').modal('show');
	});

	$('#machinesTable').on('click', '.editMachineButton', function(event) {
		event.preventDefault();
		ip = $(this).data('ip');
		$('#doEditMachineButton').data('ip', ip);
		$('#editMachineForm').modal('show');
	});

	$('#doEditMachineButton').on('click', function(event) {
		event.preventDefault();
		$('#editMachineForm').modal('hide');
		ip = $(this).data('ip');
		name = $("input[name='edit-machine-name']").val();
		 $("input[name='edit-machine-name']").val('');
		$.ajax({
			url: '/machine',
			type: 'PUT',
			dataType: 'application/json; charset=utf-8',
			data: {ip: ip, name: name},
			complete: function(jqXHR, textStatus) {
				var response = $.parseJSON(jqXHR.responseText).result;

				if (response === -1) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("IP type is incorrect or name is empty");
					$('#alert').modal('show');
				}

				else if (response === -2) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("This machine doesn't existed");
					$('#alert').modal('show');
				}

				else if (response === -998) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("User doesn't login");
					$('#alert').modal('show');
				}

				else if (response === -999) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Database Error");
					$('#alert').modal('show');
				}

				else if (response === 0) {
					$('#alertHeader').text('Success');
					$('#alertMessage').find('p').text("Machine Update!");
					$('#alert').modal('show');
					$('#machinesTable > tbody').empty();
					appendMachineTable();
				}
			}
		});
	});

	$('#confirmDeleteMachine').on('click', function(event) {
		event.preventDefault();
		$('#checkDeleteMachine').modal('hide');
		ip = $(this).data('ip');
		$.ajax({
			url: '/machine',
			type: 'DELETE',
			dataType: 'application/json; charset=utf-8',
			data: {ip: ip},
			complete: function(jqXHR, textStatus) {
				var response = $.parseJSON(jqXHR.responseText).result;

				if (response === -1) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("IP type is incorrect");
					$('#alert').modal('show');
				}

				else if (response === -2) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("This machine doesn't existed");
					$('#alert').modal('show');
				}

				else if (response === -998) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("User doesn't login");
					$('#alert').modal('show');
				}

				else if (response === -999) {
					$('#alertHeader').text('Error');
					$('#alertMessage').find('p').text("Database Error");
					$('#alert').modal('show');
				}

				else if (response === 0) {
					$('#alertHeader').text('Success');
					$('#alertMessage').find('p').text("Machine Delete!");
					$('#alert').modal('show');
					$('#machinesTable > tbody').empty();
					appendMachineTable();
				}
			}
		});
	});

	setInterval(function(){
		if($(location)[0].pathname !== '/login' && $(location)[0].pathname !== '/register'){
			$.ajax({
				url: '/message',
				type: 'GET',
				dataType: 'json',
				success: function(msg){
					if(msg.result === 0){
						var data = msg.message;
						if((new Date() / 1000 | 0) - ((new Date(data.time)) / 1000 | 0) < 5){
							notifyMe(data.body, data.ip);
						}
					}
				}
			});
		}
	}, 5000);
});