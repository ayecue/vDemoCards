/**
 *	vDemo
 *	--
 *
 *	@package			vDemo
 *	@version 			1.0.0.0
 *	@author 			swe <soerenwehmeier@googlemail.com>
 *
 */
(function ( $ ) {
	//Array List
	function ArrayList(){
		$.extend(this,{
			reference : {},
			data : []
		});
	}
	
	$.extend(ArrayList.prototype,{
		hasReference : function(prop){
			return this.reference[prop] != null && this.hasIndex(this.reference[prop]);
		},
		hasIndex : function(index){
			return !!this.data[index];
		},
		freeReference : function(prop){
			this.hasReference(prop) && this.data.splice(this.reference[prop],1);
		},
		addByReference : function(prop,input){
			this.freeReference(prop);
			this.reference[prop] = this.data.length;
			this.data.push({
				content : input,
				reference : prop
			});
		},
		mergeWith : function(object){
			var self = this;
			
			$.each(object,function(prop,item){
				self.add(prop,item);
			});
		},
		setReferenceByIndex : function(index,prop){
			if (this.hasIndex(index)){
				var oldProp = this.data[index].reference,
					oldIndex = this.reference[oldProp];
			
				this.data[index].reference = prop;
				this.reference[prop] = index;
			
				if (oldProp != prop && index == oldIndex)
				{
					this.reference[oldProp] = null;
					delete this.reference[oldProp];
				}
			}
		},
		getByReference : function(prop){
			return this.hasReference(prop) && this.data[this.reference[prop]].content;
		},
		getIndexByReference : function(prop){
			return this.hasReference(prop) && this.reference[prop];
		},
		removeByReference : function(prop){
			if (this.hasReference(prop))
			{
				this.data.splice(this.reference[prop],1);
				this.reference[prop] = null;
				delete this.reference[prop];
			}
		},
		getByIndex : function(index){
			return this.hasIndex(index) && this.data[index].content;
		},
		getReferenceByIndex : function(index){
			return this.hasIndex(index) && this.data[index].reference;
		},
		removeByIndex : function(){
			if (this.hasIndex(index))
			{
				this.reference[this.data[index].reference] = null;
				delete this.reference[this.data[index].reference];
				this.data.splice(index,1);
			}
		},
		size : function(){
			return this.data.length;
		}
	});

	//DemoImage
	function DemoImage(list,image,y,z,q){
		$.extend(this,{
			wrapper : $('<li></li>'),
			image : $('<img src="'+image+'" />'),
			q : q,
			y : y,
			z : z
		});
		
		list.append(this.wrapper);
		this.wrapper.append(this.image);
		this.image.css({
			top : y,
			'z-index' : z
		});
	}

	//VisualDemo Class
	function VisualDemo(element,settings){
		var self = this,
			images = [],
			global = $(window),
			resize = function(){
				var start = self.items.getByIndex(0),
					end = self.items.getByIndex(self.items.size() - 1),
					x = (global.width() / 2) - (start.image.width() / 2),
					y = (global.height() / 2) - ((start.image.height() + end.y) / 2);
				
				self.list.css({
					top : y,
					left : x
				});
			};
	
		element.find('img').each(function(_,item){
			item = $(item);
		
			images.push(item.attr('src'));
			item.remove();
		});
	
		$.extend(self,{
			wrapper : element,
			list : $('<ul class="vDemo-list"></ul>').appendTo(element),
			items : new ArrayList(),
			images : images,
			offset : 60,
			changeDuration : 800,
			fadeDuration : 200,
			factor : 0.75,
			fadeTo : 0.5
		},settings);
		
		for (var index = images.length, counter = 0; index--; counter++)
		{
			var di = new DemoImage(
				self.list,
				images[counter],
				counter * self.offset,
				index,
				counter
			);
		
			di.wrapper.attr('class','index'+index+(index == 0 ? ' last' : '')+(counter == 0 ? ' first' : ''));
			di.image.data('vDemo-image',di);
			self.items.addByReference(di.y,di);
		}
		
		global.resize(resize).load(resize);
	}

	$.extend(VisualDemo.prototype,{
		_changeOffset : function(){
			var self = this;
		
			for (var index = 0, temp; temp = self.items.getByIndex(index++);(function(di){
				var newY =  di.q * self.offset;
				
				di.image.css('top',newY);
				di.y = newY;
				self.items.setReferenceByIndex(di.q,newY);
			})(temp));
		},
		_update : function(){
			var self = this;
		
			for (var index = 0, temp; temp = self.items.getByIndex(index++);(function(di){
				di.image.css('z-index',di.z);
				di.wrapper.attr('class','index'+di.z+(di.z == 0 ? ' last' : '')+(di.q == 0 ? ' first' : ''));
				di.image.data('vDemo-image',di);
			})(temp));
		},
		_resort : function(a,b){
			var itemA = this.items.getByIndex(a.q),
				itemB = this.items.getByIndex(b.q),
				clone = $.extend({},itemA);
		
			itemA.image = itemB.image;
			itemA.wrapper = itemB.wrapper;
			itemB.image = clone.image;
			itemB.wrapper = clone.wrapper;

			this._update();
		},
		_motion : function(direction,a,y){
			var next = this.items.getByReference(a.y+direction),
				dataname = 'vDemo-animateto('+direction+')';
				
			if (!!next && y != a.y){
				var ny = next.image[0].offsetTop,
					cy = a.image[0].offsetTop,
					moveDown = direction > 0,
					rawNext = next.image[0];
					
				if ((moveDown && ny < cy) || (!moveDown && ny > cy))
				{
					this._resort(a,next);
				}
				else if (a.image.data(dataname) != rawNext)
				{
					var isNextMoving = next.image.hasClass('vDemo-moving'),
						left = parseInt((next.image.width()) * (moveDown ? this.factor : -this.factor)),
						cleft = parseInt(a.wrapper.css('margin-left')),
						time = (this.fadeDuration + this.changeDuration) / this.images.length;
					
					((moveDown && left > cleft) || (!moveDown && left < cleft)) && a.wrapper.animate({
						'margin-left' : isNextMoving && cleft != left ? left / 2 : left
					},{
						duration : time,
						queue : false
					});
					
					a.image.data(dataname,rawNext);
				}
			}
			else if (!!a.image.data(dataname))
			{
				a.wrapper.animate({
					'margin-left' : 0
				},{
					duration : (this.fadeDuration + this.changeDuration) / this.images.length,
					queue : false
				});
				
				a.image.removeData(dataname);
			}
		},
		_animate : function(a,b,y,f){
			var self = this;
		
			a.fadeTo(self.fadeDuration,self.fadeTo).animate({
				top : y
			},{
				duration : self.changeDuration,
				progress : function(){
					self._motion(f,a.data('vDemo-image'),y);
				},
				complete : function(){
					self._resort(b,a.fadeTo(self.fadeDuration,1).data('vDemo-image'));
					self.wrapper.removeClass('vDemo-shuffling');
					a.removeClass('vDemo-moving');
				}
			});
		},
		changeTo : function(to){
			var first = this.items.getByReference(0);
			
			if (to.z < first.z && !this.wrapper.hasClass('vDemo-shuffling'))
			{
				this.wrapper.addClass('vDemo-shuffling');
				to.image.addClass('vDemo-moving');
				first.image.addClass('vDemo-moving');
				this._animate(first.image,to,to.y,this.offset);
				this._animate(to.image,first,first.y,-this.offset);
			}
		}
	});
	
	//Extend changer to $.fn
	$.fn.vDemoGet = function(){
		var eq = this.eq(0),
			cached = eq.data('vDemo-object');
			
		if (cached){
			return cached;
		}
		
		return this;
	}
	
	//Extend changer to $.fn
	$.fn.vDemoSet = function(settings){
		var eq = this.eq(0),
			cached = eq.data('vDemo-object');
			
		if (cached){
			$.extend(cached,settings);
		}
		
		return this;
	}

	//Extend to $.fn
	$.fn.vDemo = function(settings){
		return this.each(function(index,item){
			item = $(item);
			
			var cached = item.data('vDemo-object');
			
			if (!cached)
			{
				var demo = new VisualDemo(item,settings);
				
				for (var index = 0, temp; temp = demo.items.getByIndex(index++);(function(di){
					di.image.click(function(){
						demo.changeTo($(this).data('vDemo-image'));
					});
				})(temp));
				
				item.data('vDemo-object',demo);
			}
		});
	}
}( jQuery ));