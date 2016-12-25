$(document).ready(function() {
	function load(){
		setTimeout(function(){
			$('#loader').fadeOut('slow/400/fast');
			$('.content').css('display', 'block');
		}, 500);
		
	}

	load();

	$('#loginButton').on('click', function(event) {
		event.preventDefault();
		var email = $('input[name=email]').val();
		var password = $('input[name=password]').val();

		if (email == '' || password == '') {
			$('.modal-title').text('Warning');
			$('.modal-body').find('p').text("Email and password can't be empty");
			$('.modal').modal('show');
			return false;
		}

		var data = JSON.stringify({email: email, password: password});
		$.ajax({
	        url: '/login', 
	        type: 'POST',
	        data: data,
	        contentType: 'application/json; charset=utf-8',
	        dataType: "json",
	        complete: function(jqXHR, textStatus) {
	        	var response = $.parseJSON(jqXHR.responseText).result;
	        	if (response === -1) {
	        		$('.modal-title').text('Error');
					$('.modal-body').find('p').text("Email or password is incorrect");
					$('.modal').modal('show');
					return false;
	        	}

	        	if (response === -999) {
	        		$('.modal-title').text('Error');
					$('.modal-body').find('p').text("Database Error");
					$('.modal').modal('show');
					return false;
	        	}

	        	if(response === 0) {
	        		window.location.href('/');
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
			$('.modal-title').text('Warning');
			$('.modal-body').find('p').text("Email and password can't be empty");
			$('.modal').modal('show');
			return false;
		}

		if (password !== passwordCheck) {
			$('.modal-title').text('Warning');
			$('.modal-body').find('p').text("Password and Password Check must be the same");
			$('.modal').modal('show');
			return false;
		}

		var data = JSON.stringify({email: email, password: password})

		$.ajax({
	        url: '/register', 
	        type: 'POST',
	        data: data,
	        contentType: 'application/json; charset=utf-8',
	        dataType: "json",
	        complete: function(jqXHR, textStatus) {
	        	var response = $.parseJSON(jqXHR.responseText).result;
	        	if (response === -1) {
	        		$('.modal-title').text('Error');
					$('.modal-body').find('p').text("Your information type is incorrect");
					$('.modal').modal('show');
					return false;
	        	}

	        	if (response === -2) {
	        		$('.modal-title').text('Error');
					$('.modal-body').find('p').text("This is Email have been registered");
					$('.modal').modal('show');
					return false;
	        	}

	        	if (response === -999) {
	        		$('.modal-title').text('Error');
					$('.modal-body').find('p').text("Database Error");
					$('.modal').modal('show');
					return false;
	        	}

	        	if(response === 0) {
        			$(location).attr('href', '/login');
	        	}
	        }
    	});
	});
});