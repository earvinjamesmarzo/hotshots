angular.module('app.services', [])
.factory('sharedCartService', ['$ionicPopup', function($ionicPopup) {
	var cartObj = {};
	cartObj.cart = [];
	cartObj.total_amount = 0;
	cartObj.total_qty = 0;
	cartObj.cart.add = function(id, image, name, price, qty) {
		if (cartObj.find(id) != -1) {
			var alertPopup = $ionicPopup.alert({
				title: 'Product Already Added',
				template: 'Increased the item quantity from the cart.'
			});
			
			for (var i = 0, len = cartObj.cart.length; i < len; i++) {
				if (cartObj.cart[i].cart_item_id === id) {
					cartObj.cart[i].cart_item_qty+=1;
					cartObj.total_qty+= 1;
					cartObj.total_amount+= parseInt(cartObj.cart[i].cart_item_price);
					break;
				}
			}
		} else {
			cartObj.cart.push({
				"cart_item_id": id,
				"cart_item_image": image,
				"cart_item_name": name,
				"cart_item_price": price,
				"cart_item_qty": qty
			});
			cartObj.total_qty += 1;
			cartObj.total_amount += parseInt(price);
			var alertPopup = $ionicPopup.alert({
				title: 'Product Added',
				template: name + ' has beed added to cart.',
			});
		}
	};
	cartObj.find = function(id) {
		var result = -1;
		for (var i = 0, len = cartObj.cart.length; i < len; i++) {
			if (cartObj.cart[i].cart_item_id === id) {
				result = i;
				break;
			}
		}
		return result;
	};
	cartObj.cart.findQuantity = function(id) {
		var result = 0;
		for (var i = 0, len = cartObj.cart.length; i < len; i++) {
			if (cartObj.cart[i].cart_item_id === id) {
				result = cartObj.cart[i].cart_item_qty;
				break;
			}
		}
		return result;
	};
	cartObj.cart.drop = function(id) {
		var temp = cartObj.cart[cartObj.cart.find(id)];
		cartObj.total_qty -= parseInt(temp.cart_item_qty);
		cartObj.total_amount -= (parseInt(temp.cart_item_qty) * parseInt(temp.cart_item_price));
		cartObj.cart.splice(cartObj.cart.find(id), 1);
	};
	cartObj.cart.increment = function(id) {
		cartObj.cart[cartObj.cart.find(id)].cart_item_qty += 1;
		cartObj.total_qty += 1;
		cartObj.total_amount += (parseInt(cartObj.cart[cartObj.cart.find(id)].cart_item_price));
	};
	cartObj.cart.decrement = function(id) {
		cartObj.total_qty -= 1;
		cartObj.total_amount -= parseInt(cartObj.cart[cartObj.cart.find(id)].cart_item_price);
		if (cartObj.cart[cartObj.cart.find(id)].cart_item_qty == 1) { // if the cart item was only 1 in qty
			cartObj.cart.splice(cartObj.cart.find(id), 1); //edited
		} else {
			cartObj.cart[cartObj.cart.find(id)].cart_item_qty -= 1;
		}
	};
	return cartObj;
}])
.factory('cartItemCountService', [function() {
	var itemsObj = {};
	itemsObj.count = 0;
	itemsObj.increment = function(value) {
		itemsObj.count += value;
	};
	itemsObj.decrement = function(value) {
		itemsObj.count -= value;
	};
	itemsObj.clear = function() {
		itemsObj.count = 0;
	};
	return itemsObj;
}])
.factory('sharedFilterService', [function() {
	var obj = {};
	obj.str = "http://iligtas.ph/hotshots/food_menu.php?till=";
	obj.sort = "";
	obj.search = "";
	obj.category = "";
	obj.till = 0;
	obj.getUrl = function() {
		obj.till = obj.till + 5;
		obj.str = "http://iligtas.ph/hotshots/food_menu.php?till=" + obj.till; // pass the value to url
		if (obj.sort != "" && obj.category != "") {
			obj.str = obj.str + "&category=" + obj.category + "&sort=" + obj.sort;
		} else if (obj.category != "") {
			obj.str = obj.str + "&category=" + obj.category;
		} else if (obj.sort != "") {
			obj.str = obj.str + "&sort=" + obj.sort;
		}
		return obj.str;
	};
	return obj;
}])
.factory('countdownService', ['$timeout', function($timeout) {
	var cdObj = {};
	cdObj.mins = 30;
	cdObj.disp = "";
	var timeoutObj;
	
	cdObj.countdown = function(){
		console.log("TIME", cdObj.mins);
		timeoutObj = $timeout(cdObj.countdown, 1000);
		
		cdObj.mins -= 1;
		if (cdObj.mins > 0) {
			cdObj.disp = cdObj.mins;
			timeoutObj = $timeout(cdObj.countdown, 1000);
		}
		else {
			cdObj.disp = "";
			cdObj.stop();
		}
    };
	
	cdObj.start = function(){
		$timeout(cdObj.countdown, 1000);
	};
	
	cdObj.stop = function(){
		cdObj.disp = "";
		$timeout.cancel(timeoutObj);
		cdObj.mins = 30;
    };
	
	return cdObj;
}])
.factory('statusUpdateService', ['$interval', function($interval) {
	var updObj = {};
	updObj.msg = "Please wait...";
	var statustimer;
	
	status_url = "http://iligtas.ph/hotshots/orderStatus.php?name=" + sessionStorage.getItem('loggedin_name');
	
	updObj.startStatusUpdate = function() {
		console.log("1");
		statustimer = $interval(function () {
			$http.get(status_url)
			.success(function(response) {
				if (response == -1){
					updObj.msg = "You have no pending orders.";
					document.getElementById("stat").src="img/emptycart.jpg";
					updObj.stopStatusUpdate();
				}
				else if (response == 0){
					updObj.msg = "Your order is being processed.";
					document.getElementById("stat").src="img/loader.gif";
				}
				else if (response == 1){
					updObj.msg = "Delivery is on its way to you.";
					document.getElementById("stat").src="img/deliveryguy.jpg";
				}
				else if (response == 2){
					updObj.msg = "Your order has been declined.\r\nPlease try again.";
					document.getElementById("stat").src="img/emptycart.jpg";
					updObj.stopStatusUpdate();
				}
			});
		}, 3000);
	};
	
	updObj.stopStatusUpdate = function() {
		$interval.cancel(statustimer);
		console.log("Status update timer stopped.");
	}
	
	return updObj;
}])
.service('BlankService', [function() {}]);