angular.module('app.controllers', [])
.controller('indexCtrl', function($scope, cartItemCountService) {
	$scope.$watch(function() { return cartItemCountService.count; }, function(value) { $scope.number = value; });
})
.controller('menuCtrl', function($scope, $http, sharedCartService, sharedFilterService, cartItemCountService) {
	var cart = sharedCartService.cart;
	sessionStorage.setItem('productsOnCart', []);
	$scope.slide_items = [{
		"p_id": "1",
		"p_name": "New Chicken Maharaja",
		"p_description": "Product Description",
		"p_image_id": "slide_1",
		"p_price": "183"
	}, {
		"p_id": "2",
		"p_name": "Big Spicy Chicken Wrap",
		"p_description": "Product Description",
		"p_image_id": "slide_2",
		"p_price": "171"
	}, {
		"p_id": "3",
		"p_name": "Big Spicy Paneer Wrap",
		"p_description": "Product Description",
		"p_image_id": "slide_3",
		"p_price": "167"
	}];
	// Lazy-load the list.
	$scope.noMoreItemsAvailable = false;
	// Loads the menu @ onload event.
	$scope.$on('$stateChangeSuccess', function() {
		$scope.loadMore(); // Added infinite scroll.
	});
	// Loads the list.
	$scope.loadMore = function() {
		str = sharedFilterService.getUrl();
		$http.get(str).success(function(response) {
			$scope.menu_items = response.records;
			$scope.hasmore = response.has_more; // "has_more": 0 or number of items left.
			$scope.$broadcast('scroll.infiniteScrollComplete');
		});
		// Check if there is more data to be loaded.
		if ($scope.hasmore == 0) {
			$scope.noMoreItemsAvailable = true;
		}
	};
	// Show the Products page.
	$scope.showProductInfo = function(id, desc, img, name, price) {
		sessionStorage.setItem('product_info_id', id);
		sessionStorage.setItem('product_info_desc', desc);
		sessionStorage.setItem('product_info_img', img);
		sessionStorage.setItem('product_info_name', name);
		sessionStorage.setItem('product_info_price', price);
		window.location.href = "#/page13";
	};
	// Add items to cart.
	$scope.addToCart = function(id, image, name, price, $ionicPopup) {
		cart.add(id, image, name, price, 1);
		cartItemCountService.increment(1);
	};
})
.controller('cartCtrl', function($scope, $http, $ionicPopup, $state, sharedCartService, cartItemCountService) {
	$scope.$on('$stateChangeSuccess', function() {
		$scope.cart = sharedCartService.cart;
		$scope.total_qty = sharedCartService.total_qty;
		$scope.total_amount = sharedCartService.total_amount;
	});
	$scope.removeFromCart = function(c_id) {
		cartItemCountService.decrement($scope.cart.findQuantity(c_id));
		$scope.cart.drop(c_id);
		$scope.total_qty = sharedCartService.total_qty;
		$scope.total_amount = sharedCartService.total_amount;
	};
	$scope.inc = function(c_id) {
		$scope.cart.increment(c_id);
		$scope.total_qty = sharedCartService.total_qty;
		$scope.total_amount = sharedCartService.total_amount;
		cartItemCountService.increment(1);
	};
	$scope.dec = function(c_id) {
		$scope.cart.decrement(c_id);
		$scope.total_qty = sharedCartService.total_qty;
		$scope.total_amount = sharedCartService.total_amount;
		cartItemCountService.decrement(1);
	};
	$scope.checkout = function() {
		if ($scope.total_amount > 0) {
			if (sessionStorage.getItem('loggedin_id') != null) {
				$scope.submitCart();
			} 
			/*else {
				$state.go('checkOut');
			}*/
		} else {
			var alertPopup = $ionicPopup.alert({
				title: 'No item in your Cart',
				template: 'Please add some items!'
			});
		}
	};
	$scope.submitCart = function() {
		var cart = sharedCartService;
		var hasTransaction = sessionStorage.getItem('hasTransaction');
		if (hasTransaction == 1){
			var alertPopup = $ionicPopup.alert({
				title: 'Order Pending.',
				template: 'You have a pending order.'
			});
			cart.cart = [];
			cart.total_qty = 0;
			cart.total_amount = 0;
			cartItemCountService.clear();
			window.location.href = "#/page15";
		}
		else {
			var confirmPopup = $ionicPopup.confirm({
				title: 'Submit Order',
				template: 'Do you want to submit your order?'
			}).then(function(res) {
				if (res) {
					$scope.loggedin_id = sessionStorage.getItem('loggedin_id');
					$scope.loggedin_name = sessionStorage.getItem('loggedin_name');
					$scope.loggedin_phone = sessionStorage.getItem('loggedin_phone');
					$scope.loggedin_address = sessionStorage.getItem('loggedin_address');
					var products = [];
					for (var i = 0; i < sharedCartService.cart.length; i++) {
						products.push(sharedCartService.cart[i])
					}
					var today = new Date();
					$http.get('http://iligtas.ph/hotshots/checkout.php?' + 'name=' + $scope.loggedin_name + '&contact=' + $scope.loggedin_phone + '&address=' + $scope.loggedin_address + '&products=' + JSON.stringify(products) + '&total=' + sharedCartService.total_amount + '&date=' +today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()).success(function(data) {
						var alertPopup = $ionicPopup.alert({
							title: 'Successfully checked out.',
							template: '<center>Checkout Total: <b>' + sharedCartService.total_amount + '</b></center>'
						});
						cart.cart = [];
						cart.total_qty = 0;
						cart.total_amount = 0;
						cartItemCountService.clear();
						sessionStorage.setItem('hasTransaction', 1);
						
						$state.go('orderStatus', {}, {
							location: "replace",
							reload: true
						});
					});
				}
			});
		}
	};
})
.controller('checkOutCtrl', function($scope, sharedCartService, $http, $ionicPopup) {
	$scope.validateLocation = function(addressToValidate) {
		// Handle the location validation using a boolean
		// property
		var isValidLocation = false;
		// Load the Locations List XML file
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				findLocation(this);
			}
		};
		xhttp.open("GET", "js/locationslist.xml", false);
		xhttp.send();
		// Iterate through the location nodes and check wether
		// the address is among the available delivery locations
		function findLocation(xml) {
			var xmlDoc = xml.responseXML;
			var x = xmlDoc.getElementsByTagName('location');
			for (var i = 0; i < x.length; i++) {
				var location = x[i].firstChild.nodeValue;
				if (matchRuleShort(addressToValidate, "*" + location + "*") == true) {
					isValidLocation = true;
				}
			}
		}
		// Wildcard String Comparison
		function matchRuleShort(str, rule) {
			return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
		}
		return isValidLocation;
	};
	$scope.hasCheckedOut = false;
	$scope.checkOut = function(name, phone, address, e) {
		if (name == undefined || name.length == 0) {
			alert("Please enter name.")
		} else if (phone == undefined || phone.length == 0) {
			alert("Please enter phone number")
		} else if (address == undefined || address.length == 0) {
			alert("Please enter address.")
		} else if (!$scope.validateLocation(address)) {
			alert("Delivery service is unavailable at your location.")
		} else {
			$scope.hasCheckedOut = true;
			var products = [];
			for (var i = 0; i < sharedCartService.cart.length; i++) {
				products.push(sharedCartService.cart[i])
			}
			$http.get('http://iligtas.ph/hotshots/checkout.php?name=' + name + '&contact=' + phone + '&address=' + address + '&products=' + JSON.stringify(products) + '&total=' + sharedCartService.total_amount).success(function(data) {
				var alertPopup = $ionicPopup.alert({
					title: 'Successfully checked out.',
					template: '<center>Checkout Total: <b>' + sharedCartService.total_amount + '</b></center>'
				});
				var cart = sharedCartService;
				cart.cart = [];
				cart.total_qty = 0;
				cart.total_amount = 0;
				$scope.hasCheckedOut = false;
				document.getElementById('coname').value = '';
				document.getElementById('conumber').value = '';
				document.getElementById('coaddress').value = '';
			});
		}
	}
})
.controller('loginCtrl', function($scope, $http, $ionicPopup, $state, $ionicHistory) {
	$scope.user = {};
	$scope.login = function() {
		auth_url = "http://iligtas.ph/hotshots/user-details.php?e=" + $scope.user.email + "&p=" + $scope.user.password;
		$http.get(auth_url).success(function(response) {
			$scope.user_details = response.records[0];
			sessionStorage.setItem('loggedin_id', $scope.user_details.u_id);
			sessionStorage.setItem('loggedin_name', $scope.user_details.u_name);
			sessionStorage.setItem('loggedin_phone', $scope.user_details.u_phone);
			sessionStorage.setItem('loggedin_address', $scope.user_details.u_address);
			sessionStorage.setItem('hasTransaction', 0);
			$ionicHistory.nextViewOptions({
				disableAnimate: true,
				disableBack: true
			});
			lastView = $ionicHistory.backView();
			console.log('Last View', lastView);
			if (lastView != null && lastView.stateId == "checkOut") {
				$state.go('checkOut', {}, {
					location: "replace",
					reload: true
				});
			} else {
				$state.go('profile', {}, {
					location: "replace",
					reload: true
				});
			}
		}).error(function() {
			var alertPopup = $ionicPopup.alert({
				title: 'Login failed!',
				template: 'Please check your credentials!'
			});
		});
	};
})
.controller('signupCtrl', function($scope, $http, $ionicPopup, $state, $ionicHistory) {
	$scope.data = {
		email: '',
		password: '',
		phone: '',
		address: ''
	};
	$scope.signup = function(data) {
		if ($scope.data.email == undefined || $scope.data.email.length == 0) {
			var alertPopup = $ionicPopup.alert({
				title: "Invalid Email",
				template: "Please enter a valid email address."
			});
		} else if ($scope.data.password == undefined || $scope.data.password.length == 0) {
			var alertPopup = $ionicPopup.alert({
				title: "Enter Password",
				template: "Please enter your password."
			});
		} else if ($scope.data.phone == null || $scope.data.phone == undefined || $scope.data.phone.length == 0) {
			var alertPopup = $ionicPopup.alert({
				title: "Enter Phone Number",
				template: "Please enter your phone number."
			});
		} else if ($scope.data.address == undefined || $scope.data.address.length == 0) {
			var alertPopup = $ionicPopup.alert({
				title: "Enter Address",
				template: "Please enter your address."
			});
		} else if (!$scope.validateLocation($scope.data.address)) {
			var alertPopup = $ionicPopup.alert({
				title: "Delivery Service Unavailable",
				template: "Delivery service is unavailable at your location."
			});
		} else {
			var signup_url = "http://iligtas.ph/hotshots/signup.php";
			var signup_obj = "?un=" + data.email + "&ps=" + data.password + "&ph=" + data.phone + "&add=" + data.address;
			$http.get(signup_url + signup_obj).success(function(response) {
				if (response == "0") {
					$scope.title = "Account Created";
					$scope.template = "Your account has been successfully created!";
					window.location.href = "#/page4";
				} else {
					$scope.title = "Email Already Exists";
					$scope.template = "Please enter another email.";
				}
				var alertPopup = $ionicPopup.alert({
					title: $scope.title,
					template: $scope.template
				});
			}).error(function() {
				var alertPopup = $ionicPopup.alert({
					title: "Registration Failed",
					template: "Registration failed.\r\nPlease contact our technical team."
				});
			});
		}
	}
	$scope.validateLocation = function(addressToValidate) {
		var isValidLocation = false;
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				findLocation(this);
			}
		};
		xhttp.open("GET", "js/locationslist.xml", false);
		xhttp.send();

		function findLocation(xml) {
			var xmlDoc = xml.responseXML;
			var x = xmlDoc.getElementsByTagName('location');
			for (var i = 0; i < x.length; i++) {
				var location = x[i].firstChild.nodeValue;
				if (matchRuleShort(addressToValidate, "*" + location + "*") == true) {
					isValidLocation = true;
				}
			}
		}

		function matchRuleShort(str, rule) {
			return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
		}
		return isValidLocation;
	};
})
.controller('filterByCtrl', function($scope, sharedFilterService) {
	$scope.Categories = [{
		id: 1,
		name: 'Beverages'
	}, {
		id: 2,
		name: 'Breakfast'
	}, {
		id: 3,
		name: 'Burgers'
	}, {
		id: 4,
		name: 'Dessert'
	}, {
		id: 5,
		name: 'Favorites'
	}, {
		id: 6,
		name: 'Fries'
	}, {
		id: 7,
		name: 'Hot Drinks'
	}, {
		id: 8,
		name: 'Pasta'
	}, {
		id: 9,
		name: 'Pitchers'
	}, {
		id: 10,
		name: 'Ricemeal'
	}, {
		id: 11,
		name: 'Salad'
	}, {
		id: 12,
		name: 'Sandwich'
	}, {
		id: 13,
		name: 'Soup'
	}];
	$scope.getCategory = function(cat_list) {
		categoryAdded = cat_list;
		var c_string = ""; // will hold the category as string
		for (var i = 0; i < categoryAdded.length; i++) {
			c_string += (categoryAdded[i].id + "||");
		}
		c_string = c_string.substr(0, c_string.length - 2);
		sharedFilterService.category = c_string;
		window.location.href = "#/page1";
	};
})
.controller('sortByCtrl', function($scope, sharedFilterService) {
	$scope.sort = function(sort_by) {
		sharedFilterService.sort = sort_by;
		console.log('sort', sort_by);
		window.location.href = "#/page1";
	};
})
.controller('paymentCtrl', function($scope) {})
.controller('profileCtrl', function($scope, $rootScope, $ionicHistory, $state) {
	$scope.loggedin_id = sessionStorage.getItem('loggedin_id');
	$scope.loggedin_name = sessionStorage.getItem('loggedin_name');
	$scope.loggedin_phone = sessionStorage.getItem('loggedin_phone');
	$scope.loggedin_address = sessionStorage.getItem('loggedin_address');
	$scope.logout = function() {
		delete sessionStorage.loggedin_id;
		delete sessionStorage.loggedin_name;
		delete sessionStorage.loggedin_phone;
		delete sessionStorage.loggedin_address;
		$ionicHistory.nextViewOptions({
			disableAnimate: true,
			disableBack: true
		});
		$state.go('login', {}, {
			location: "replace",
			reload: true
		});
	};
})
.controller('myOrdersCtrl', function($scope) {})
.controller('editProfileCtrl', function($scope) {})
.controller('favoritesCtrl', function($scope, $http, $ionicPopup, $state, $ionicHistory) {
	$scope.fav = {
		comment: ''
	};
	$scope.feedback = function(fav) {
		if ($scope.fav.comment == undefined || $scope.fav.comment.length == 0) {
			alert("Please enter your suggestion or comment.")
		} else {
			var feedback_url = "http://iligtas.ph/hotshots/feedback.php?id=" + sessionStorage.getItem('loggedin_id') + "&fb=" + fav.comment;
			$http.get(feedback_url).success(function() {
				var alertPopup = $ionicPopup.alert({
					title: "Thank You!",
					template: "Your suggestions has been sent successfully. Thank you!"
				});
			}).error(function() {
				var alertPopup = $ionicPopup.alert({
					title: "Sending Failed",
					template: "Cannot send your comments at this time."
				});
			});
		}
	}
})
.controller('productPageCtrl', function($scope, sharedCartService, cartItemCountService) {
	var cart = sharedCartService.cart;
	//onload event
	angular.element(document).ready(function() {
		$scope.id = sessionStorage.getItem('product_info_id');
		$scope.desc = sessionStorage.getItem('product_info_desc');
		$scope.img = "img/" + sessionStorage.getItem('product_info_img') + ".png";
		$scope.name = sessionStorage.getItem('product_info_name');
		$scope.price = sessionStorage.getItem('product_info_price');
		$scope.addToCart = function(id, image, name, price, $ionicPopup) {
			cart.add(id, image.split('img/').join("").split('.png').join(""), name, price, 1);
			cartItemCountService.increment(1);
		};
	});
})
.controller('mapCtrl', function($scope) {
	/*
	$scope.initMap = function() {
		var mapCanvas = document.getElementById("map");
		var center = new google.maps.LatLng(14.8203331, 120.2811585);
		var mapOptions = {
			center: center,
			zoom: 16
		}
		var map = new google.maps.Map(mapCanvas, mapOptions);
		var socket = io.connect('http://hotshots-middleware.herokuapp.com');
		var currentPosition = null;
		var marker = new google.maps.Marker({
			position: currentPosition || center,
			map: map,
			title: 'Hello World!',
			duration: 1000
		});
		socket.on('server:Location', function(data) {
			console.log(data);
			currentPosition = new google.maps.LatLng(data.lat, data.long);
			if (marker) {
				marker.setPosition(currentPosition);
			}
		})
	}
	$scope.initMap();
	*/
})
.controller('orderStatusCtrl', function($scope, $http, $interval, countdownService) {
	status_url = "http://iligtas.ph/hotshots/orderStatus.php?name=" + sessionStorage.getItem('loggedin_name');
	var statustimer;
	
	$scope.$on('$stateChangeSuccess', function() {
		$scope.msg = "Please wait...";
		document.getElementById("stat").src="img/loader.gif";
		
		if (sessionStorage.getItem('hasTransaction') == 0){
			console.log("CLEAR");
			$scope.msg = "You have no pending orders.";
			document.getElementById("stat").src="img/emptycart.jpg";
		}
		else {
			$scope.startStatusUpdate();
		}
		
	});
	
	$scope.startStatusUpdate = function() {
		$scope.statustimer = $interval(function () {
			$http.get(status_url)
			.success(function(response) {
				/*
				if (response == -1){
					console.log("CLEAR");
					$scope.msg = "You have no pending orders.";
					document.getElementById("stat").src="img/emptycart.jpg";
					$scope.stopStatusUpdate();
				}
				else 
				*/
				if (response == 0){
					console.log("PROCESSING");
					$scope.msg = "Your order is being processed.";
					document.getElementById("stat").src="img/loader.gif";
				}
				else if (response == 1){
					console.log("DELIVERING");
					$scope.msg = "Delivery is on its way to you.";
					document.getElementById("stat").src="img/deliveryguy.jpg";
				}
				else if (response == 2){
					console.log("DECLINED");
					$scope.msg = "Your order has been declined.";
					document.getElementById("stat").src="img/emptycart.jpg";
					sessionStorage.setItem('hasTransaction', 0);
					$scope.stopStatusUpdate();
				}
				else if (response == 3){
					console.log("DELIVERED");
					$scope.msg = "You have no pending orders.";
					document.getElementById("stat").src="img/emptycart.jpg";
					sessionStorage.setItem('hasTransaction', 0);
					$scope.stopStatusUpdate();
				}
			});
		}, 3000);
	};
	
	$scope.stopStatusUpdate = function() {
		$interval.cancel($scope.statustimer);
		console.log("Status update timer stopped.");
	}
});