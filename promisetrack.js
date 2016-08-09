(function(){
	'use strict';
	
	var promiseTrackModule = angular.module( 'promisetrack', [] );

	//Maybe do this through providers ?
	promiseTrackModule.constant( 'promiseTrackDefaultOptions', {
		SCOPE_LOADING: 'loading', //That will be added to the scope
		BUTTON_LOADING_CSS: 'loading', //That will be added to the button
		DISABLE_BUTTON: true,
		SHOW_LOADING_BAR: true,
		MASK_CONTENT: false,
		/* @Deprecated */
		BOUND_EVENTS: 'click',
		START_EVENT: 'startLoader',
		END_EVENT: 'endLoader',
		ERROR_EVENT: 'promiseError'
	} );
	
	/**
	 * promise-track binds loading feedback to the state of a promise.
	 *
	 * sample:
	 * <button
	 *     class="btn"
	 *     promise-track="promise"
	 *     ng-click=" promise = fakePromise() ">
	 *     click me
	 * </button>
	 */
	promiseTrackModule.directive( 'promiseTrack', function( promiseTrackDefaultOptions ) {
		
		var lastError = null;

		var directive = {
			restrict: 'A',
			priority: 0,
			link: function( $scope, $el, attr ) {
				var promiseExpr = attr.promise || attr.promiseTrack;
				var lastPromise;
				var defaultOptions = promiseTrackDefaultOptions;
				var options = angular.extend( {}, defaultOptions, $scope.$eval(attr.loaderOptions) );

				var startLoader = function() {
					$scope[options.SCOPE_LOADING] = true;
					if (options.BUTTON_LOADING_CSS) {$el.addClass(options.BUTTON_LOADING_CSS);}
					if (options.DISABLE_BUTTON) {
						$el.prop('disabled', true);
						$el.addClass('disabled');
					}
					// TODO: not an issue yet, but cumulating promise track on the same promise duplicates start/end loader events.
					$scope.$emit( options.START_EVENT, lastPromise );
				};
				var endLoader = function() {
					$scope[options.SCOPE_LOADING] = false;
					if (options.BUTTON_LOADING_CSS) {$el.removeClass(options.BUTTON_LOADING_CSS);}
					if (options.DISABLE_BUTTON) {
						$el.prop('disabled', false);
						$el.removeClass('disabled');
					}
					$scope.$emit( options.END_EVENT, lastPromise ); // TODO: this won't work with parallel loader calls
				};
				var errorHandler = function( error ) {
					if(error !== lastError){
						$scope.$emit( options.ERROR_EVENT, error );
						lastError = error;
					}
				};

				//TODO: what happens when promiseExpr gives a new promise but previous one is not resolved ?
				//Passive and observative way. Gooder
				$scope.$watch( promiseExpr, function(afterPromise,before) {
					if ( !afterPromise ) {return;}
					if ( !afterPromise.then && !afterPromise.then && !afterPromise.finally) {throw 'promiseTrack: invalid promise passed';}

					lastPromise = afterPromise;
					startLoader(afterPromise);
					afterPromise.finally(endLoader);
					afterPromise.catch(errorHandler);

				});
			}
		};
		return directive;
	} );


})();

