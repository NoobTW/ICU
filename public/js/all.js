$(document).ready(function() {

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

		$.post('/login', {email: email, password: password}, function(data) {
			console.log(data);
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
			console.log(data);
		});
	});
});