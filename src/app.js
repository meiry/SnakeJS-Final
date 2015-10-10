//global varibales with default values 
var SnakeArray = null; 
var SnakeFood = null; 
var spriteBackGround = null; 
var BackGroundWidth = 0;;
var BackGroundHeight = 0;
var BackGroundPos;
var Direction ="";
var score = 0;  
var cellWidth = 30;
var Enum = { 
			snakecell:0,
			snakefood:1,
			background:2,
			touchup:3,
			touchdown:4,
			touchright:5,
			touchleft:6
			};
var snakeJSGameLayer = null;
var snakeLength = 5; //Length of the snake
var ScoreLabel = null;
var GameOverLabel = null;
var bCollisionDetected = false;
var spriteTouchUP = null;
var spriteTouchDown = null;
var spriteTouchLeft = null;
var spriteTouchRight = null;
var origin = null;
var winSize = null;
var SnakeJSGameLayer = null;

//The Background sprite class holding the game nodes
var SpriteBackGround = cc.Sprite.extend({
	ctor: function(texture, rect) {           
		this._super(texture, rect);
	}
});
//Snake cell class 
var SpriteSnakeCell = cc.Sprite.extend({
	ctor: function(texture) {           
		this._super(texture);
	}
});
//Snake food class 
var SpriteSnakeFood = cc.Sprite.extend({
	ctor: function(texture) {           
		this._super(texture);
	}
});

var SpriteTouch = cc.Sprite.extend({
	_listener:null,
    _fixedPriority:0,
    _removeListenerOnTouchEnded: false,

    ctor: function(priority,texture){
        this._super(texture);
        this._fixedPriority = priority || 0;
    },

    setPriority:function(fixedPriority){
        this._fixedPriority = fixedPriority;
    },

    onEnter:function(){
        this._super();

        var selfPointer = this;
        var listener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var locationInNode = selfPointer.convertToNodeSpace(touch.getLocation());
                var s = selfPointer.getContentSize();
                var rect = cc.rect(0, 0, s.width, s.height);
				var target = event.getCurrentTarget();
                if (cc.rectContainsPoint(rect, locationInNode)) {
                    selfPointer.setColor(cc.color.RED);            
                    if(bCollisionDetected)
					{
							bCollisionDetected = false;
							GameOverLabel.visible = false;
							cc.director.resume();
							snakeJSGameLayer.CreateSnake();
							snakeJSGameLayer.CreateFood();
							return true;      
					}
                    switch(selfPointer.getTag())
                    {
                    	case Enum.touchdown:
                    	{
                    	   if(direction != "up") direction = "down";
                    		break;
                    	}
                    	case Enum.touchup:
                    	{
                    		if(direction != "down") direction = "up";
                    		break;
                    	}
                    	case Enum.touchright:
                    	{
                    	    if(direction != "left") direction = "right";
                    		break;
                    	}
                    	case Enum.touchleft:
                    	{
                    	    if(direction != "right") direction = "left";
                    		break;
                    	}
                    }
                    return true;
                }
                return false;
            },
            onTouchMoved: function (touch, event) {
                //this.setPosition(this.getPosition() + touch.getDelta());
            },
            onTouchEnded: function (touch, event) {
                selfPointer.setColor(cc.color.WHITE);
                if(selfPointer._removeListenerOnTouchEnded) {
                    cc.eventManager.removeListener(selfPointer._listener);
                    selfPointer._listener = null;
                }
            }
        });

        if(this._fixedPriority != 0)
            cc.eventManager.addListener(listener, this._fixedPriority);
        else
            cc.eventManager.addListener(listener, this);
        this._listener = listener;
    },

    onExit: function(){
        this._listener && cc.eventManager.removeListener(this._listener);
        this._super();
    },

    removeListenerOnTouchEnded: function(toRemove){
        this._removeListenerOnTouchEnded = toRemove;
    },

    getListener: function() {
        return this._listener;
    }
});

 
//Game Main container class, holding all game logic functions
SnakeJSGameLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
      
       this._super();
       origin = cc.director.getVisibleOrigin();
       winSize = cc.winSize;
       //Create the background sprite 
       spriteBackGround = new SpriteBackGround(res.blank_png,
                                cc.rect(0,0,winSize.width-50,winSize.height-90));
       spriteBackGround.setAnchorPoint(0,0);
       spriteBackGround.setTag(Enum.background);
       BackGroundWidth = spriteBackGround.getBoundingBox().width;
       BackGroundHeight = spriteBackGround.getBoundingBox().height;
       //Calculate the background sprite positon by subtracting SpriteBackGround position from Main layer position 
       spriteBackGround.x = (winSize.width - BackGroundWidth)/2;
       spriteBackGround.y = (winSize.height - BackGroundHeight)/2;       
       this.addChild(spriteBackGround,1);
       BackGroundPos = {x:spriteBackGround.x, y:spriteBackGround.y};      
       //Add the score lable
       ScoreLabel = new cc.LabelTTF(setLabelString(score), "Arial", 38); 
       ScoreLabel.x = winSize.width / 2;
       ScoreLabel.y = winSize.height / 2 + 200;       
       this.addChild(ScoreLabel, 5); 
       //Add the game over lable as none visible 
       var redColor = cc.color(0, 0, 0);
       //GameOverLabel = new cc.LabelTTF("Game Over press SPACE to restart!", "Arial", 38); 
	   GameOverLabel = new cc.LabelTTF("", "Arial", 30); 
       GameOverLabel.x = winSize.width / 2;
       GameOverLabel.y = winSize.height / 2;  
       GameOverLabel.fillStyle = redColor
       this.addChild(GameOverLabel, 5); 
       GameOverLabel.visible = false;
       this.SetLableText(3);
       //if (cc.sys.os == cc.sys.OS_IOS || cc.sys.os == cc.sys.OS_ANDROID) 
       {
			 
       		this.CreateTouchControllers();
       }
       //create the snake and the food 
       this.CreateSnake();
       this.CreateFood();
       
       if (cc.sys.os === cc.sys.OS_WINDOWS) 
       {
		   
		   if ('keyboard' in cc.sys.capabilities) {
				cc.eventManager.addListener({
					event: cc.EventListener.KEYBOARD,
					onKeyPressed: function (key, event) {
					   var target = event.getCurrentTarget();
					   //Only if space key is pressed and Collision Detected the game restart
					   if(bCollisionDetected && key == "32")
					   {
							bCollisionDetected = false;
							GameOverLabel.visible = false;
							cc.director.resume();
							target.CreateSnake();
							target.CreateFood();
							return;      
					   }
					   if(key == "37" && direction != "right") direction = "left";
					   else if(key == "38" && direction != "down") direction = "up";
					   else if(key == "39" && direction != "left") direction = "right";
					   else if(key == "40" && direction != "up") direction = "down";
					 } 
				}, this);
			} else {
				cc.log("KEYBOARD Not supported");
			}  
        }           
        //This is the main game loop
        this.schedule(this.GameLoop,0.2);
 
        return true;
    },
    CreateSnake:function() {
        score = 0;
        ScoreLabel.setString(setLabelString(score));
        direction = "right";
        if(( typeof SnakeArray != 'undefined' && SnakeArray instanceof Array ) && SnakeArray.length > 0 )
        {                
            for(var i = 0; i< SnakeArray.length; i++)             
            {
                    this.removeChild(SnakeArray[i],true);                   
            }
        } 
        SnakeArray = [];   
        var elmsToRemove = SnakeArray.length - snakeLength;
        if(elmsToRemove>1)
        {
            SnakeArray.splice(snakeLength-1,elmsToRemove);
        }
        for(var i = snakeLength-1; i>=0; i--)
        {
           var spriteSnakeCell = new SpriteSnakeCell(res.snakecell_png);
           spriteSnakeCell.setAnchorPoint(0,0);
           spriteSnakeCell.setTag(Enum.snakecell);          
           var xMov = (i*cellWidth)+BackGroundPos.x;
           var yMov = (spriteBackGround.y+BackGroundHeight)-cellWidth;
           spriteSnakeCell.x = xMov;
           spriteSnakeCell.y = yMov;
           this.addChild(spriteSnakeCell,2);           
           SnakeArray.push(spriteSnakeCell); 
        }
    },            
    CreateFood:function() {   
        //Check if food Exist , remove it from the game sprite
        if(this.getChildByTag(Enum.snakefood)!=null)
        {
            this.removeChildByTag(Enum.snakefood,true); 
        }       
        var spriteSnakeFood = new SpriteSnakeFood(res.snakefood_png);
        spriteSnakeFood.setAnchorPoint(0,0);
        spriteSnakeFood.setTag(Enum.snakefood);     
        this.addChild(spriteSnakeFood,2); 
        var rndValX = 0;
        var rndValY = 0;
        var min = 0; 
        var maxWidth = BackGroundWidth;
        var maxHeight = BackGroundHeight;
        var multiple = cellWidth;
        //Place it in some random position 
        rndValX = generate(min,maxWidth,multiple);
        rndValY = generate(min,maxHeight,multiple);
        var irndX = rndValX+BackGroundPos.x;
        var irndY = rndValY+BackGroundPos.y;
        SnakeFood = {
            x: irndX , 
            y: irndY  
        };
     
       spriteSnakeFood.x = SnakeFood.x; 
       spriteSnakeFood.y = SnakeFood.y;  
    },
    //The function will be called every 0.2 milii secound
    GameLoop:function (dt) {
        //get the snake head cell 
        var SnakeHeadX = SnakeArray[0].x;
        var SnakeHeadY = SnakeArray[0].y;
        //check which direction it is heading  
        switch(direction)
        {
            case "right":
                 SnakeHeadX+=cellWidth;
            break;
            case "left":
                 SnakeHeadX-=cellWidth;
            break;
            case "up":
                 SnakeHeadY+=cellWidth;
            break;
            case "down":
                  SnakeHeadY-=cellWidth;
            break;
            default:
                cc.log("direction not defind");
        }
        //Check if the snake head Collided with the walls or with it self 
        if(CollisionDetector(SnakeHeadX, SnakeHeadY, SnakeArray))
        {                 
                bCollisionDetected = true; 
                GameOverLabel.visible = true;
                cc.director.pause();
                return;
        }
        //Check if the snake head Collided with the food
        if(SnakeHeadX == SnakeFood.x && SnakeHeadY == SnakeFood.y)
        {
                //Add snake cell after the head position
                var spriteSnaketail = new SpriteSnakeCell(res.snakecell_png);
                spriteSnaketail.setAnchorPoint(0,0);
                spriteSnaketail.setTag(Enum.snakecell);
                this.addChild(spriteSnaketail,2);
                spriteSnaketail.x = SnakeHeadX;
                spriteSnaketail.y = SnakeHeadY;
                SnakeArray.unshift(spriteSnaketail);  
                //Add point to the points display
                ScoreLabel.setString(setLabelString(score++));
                //Create new food in new position
                this.CreateFood();         
        }
        else
        {       
                var spriteSnakeCellLast = SnakeArray.pop(); //pops out the last cell
                spriteSnakeCellLast.x = SnakeHeadX; 
                spriteSnakeCellLast.y = SnakeHeadY;
                SnakeArray.unshift(spriteSnakeCellLast);
        }
 
    },
	SetLableText:function(mode) {
		if(mode == 1)
		{
			GameOverLabel.setString("Game Over press SPACE to restart!");
		}
		else if(mode == 2)
		{
			GameOverLabel.setString("Game Over press any arrows to restart!");
		}
		else if(mode == 3)
		{
			GameOverLabel.setString("Game Over press any arrows or SPACE to restart!");
		}
	},
    CreateTouchControllers:function() {
    	//create controllers   
	   spriteTouchDown = new SpriteTouch(30,res.arrow_down);      
       spriteTouchDown.setAnchorPoint(0,0);
       spriteTouchDown.x = 0;
       spriteTouchDown.y = 0;
       spriteTouchDown.setTag(Enum.touchdown); 
       	
       spriteTouchUP = new SpriteTouch(30,res.arrow_up);      
       spriteTouchUP.setAnchorPoint(0,0);
       spriteTouchUP.x = 0;
       spriteTouchUP.y = spriteTouchDown.getBoundingBox().height +20;
       spriteTouchUP.setTag(Enum.touchup); 
       
       spriteTouchRight = new SpriteTouch(30,res.arrow_right);      
       spriteTouchRight.setAnchorPoint(0,0);
       spriteTouchRight.x = winSize.width - spriteTouchDown.getBoundingBox().width -20;
       spriteTouchRight.y = 0;
       spriteTouchRight.setTag(Enum.touchright); 
       
       spriteTouchLeft = new SpriteTouch(30,res.arrow_left);      
       spriteTouchLeft.setAnchorPoint(0,0);
       spriteTouchLeft.x = spriteTouchRight.x - spriteTouchLeft.getBoundingBox().width-20;
       spriteTouchLeft.y = 0;
       spriteTouchLeft.setTag(Enum.touchleft); 
              
       this.addChild(spriteTouchUP,10);
       this.addChild(spriteTouchDown,10);
       this.addChild(spriteTouchLeft,10);
       this.addChild(spriteTouchRight,10);
    }  
});
//The snake Collision Obstacles are side walls  and itself
function CollisionDetector(snakeHeadX,snakeHeadY,snakeArray)
{
        if(snakeHeadX < spriteBackGround.x || 
                snakeHeadX > BackGroundWidth || 
                snakeHeadY < spriteBackGround.y || 
                snakeHeadY > ((spriteBackGround.y+BackGroundHeight)-cellWidth))
        {
            return true;
        }
        for(var i = 0; i < snakeArray.length; i++)
        {
                if(snakeArray[i].x == snakeHeadX && snakeArray[i].y == snakeHeadY)
                {
                 return true;
                }
        }
        return false;
}
//Rendom number generator 
function generate(min, max, multiple) 
{
    var res = Math.floor(Math.random() * ((max - min) / multiple)) * multiple + min;
    return res;
}
//Convert number to string
function setLabelString(str)
{
    var stringScore = parseInt(score).toString();
    return stringScore;   
}
//Main Game container 
var SnakeJSScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        snakeJSGameLayer = new SnakeJSGameLayer();
        this.addChild(snakeJSGameLayer);
    }
});

