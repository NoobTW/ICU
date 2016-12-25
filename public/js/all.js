$(document).ready(function() {
	function load(){
		$('#loader').fadeOut('slow/400/fast');
		$('.content').css('display', 'block');
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

		$.ajax({
	        url: '/test', 
	        type: 'POST',
	        data: {email: email},
	        contentType: 'application/json; charset=utf-8',
	        dataType: "json",
	        success: function (data) {
	            console.log(data);
	        },
	        error: function (xhr, status, error) {
	            console.log(xhr + '\n' + status + '\n' + error);
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

		$.post('/register', {email: email, password: password}, function(data) {
			console.log($.parseJson(data));
		});
	});
});