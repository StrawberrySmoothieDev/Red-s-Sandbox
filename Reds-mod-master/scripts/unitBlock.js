importPackage(Packages.arc.graphics.gl);

const F = require("func");
const W = this.global.WEATHERS;
const defaultShaderVertex = "uniform mat4 u_projTrans;attribute vec4 a_position;attribute vec2 a_texCoord0;attribute vec4 a_color;varying vec4 v_color;varying vec2 v_texCoord;void main(){gl_Position = u_projTrans * a_position;v_texCoord = a_texCoord0;v_color = a_color;}";
const defaultShaderFragment ="#define HIGHP\nuniform sampler2D u_texture;uniform float u_time;varying vec4 v_color;varying vec2 v_texCoord;void main(){vec4 color = texture2D(u_texture, v_texCoord.xy);float t = clamp((sin(u_time * .01 + gl_FragCoord.x * .01 + gl_FragCoord.y * .005) + 1.) / 2., 0., 1.);vec3 c = vec3(mix(0., 1., t), mix(.89, .39, t), mix(1., .85, t));gl_FragColor = vec4(color.rgb * c.rgb, color.a);}";

const UnitCommandBlock = extendContent(MessageBlock, "unit-block", {});
UnitCommandBlock.buildType = () => {
	const ent = extendContent(MessageBlock.MessageBuild, UnitCommandBlock, {
	    _units: [], 
		init(tile, team, shouldAdd, rotation){
			if(!this.initialized) this.create(tile.block(), team);

			this.setTeam(team.id);
			this.setWaveTimers([]);
            this.setScriptTimers([]);

			this.rotation = rotation;
			this.tile = tile;
			this.set(tile.drawx(), tile.drawy());
			if(shouldAdd) this.add();
			this.created();

            this.setMultiplier(1); 
            this.setShaders([]);
            this.setScriptText("UnitTypes.toxopid.weapons.each(cons(w => { w.reload = 0}))");
            this.addShader(["spectre", 0, true, this.x + 40, this.y, [defaultShaderVertex, defaultShaderFragment]]);
			this.setSpawnPos([Mathf.round(this.x), Mathf.round(this.y)]);

			return this;
		},
	
	    updateTile(){
	        this.super$updateTile();
	
            var scripts = this.getScriptTimers();
            for(var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if(script[3] == null) {
	                if(script[4] == false) {
		                if(script[1] == 0) {
		                	try{
			                    eval(script[2])
			                } catch(e) {
				                script[3] = e
				            };
		                    script[1] = script[0]
			            } else if(script[1] > 0) script[1] = script[1] - 1;
			        } else {
	                	try{
		                    eval(script[2]);
		                } catch(e) {
			                script[3] = e
			            }
			        } 
	            }
            };
            
            var waves = this.getWaveTimers();
            for(var i = 0; i < waves.length; i++) {
                var timer = waves[i];
                if(timer[1] == 0) {
	                for(var i = 0; i < timer[2]; i++) Vars.logic.runWave();
                    timer[1] = timer[0];
	            } else if(timer[1] > 0) timer[1] = timer[1] - 1;
            } 
	    },

	    drawSelect(){
            var sh = this.getShaders();

	        if(sh.length > 0) {
		        for(var s = 0; s < sh.length; s++) {
                    var shader = sh[s];
			        if(shader[2]) {
                        var current = Shaders.water;

                        switch (shader[1]){
                            case 0: current = Shaders.water;
                            case 1: current = Shaders.slag;
                            case 2: current = Shaders.tar;
                            case 3: current = Shaders.space;
						}; 

						if(!Vars.headless && shader[5] != null){
						    current = new JavaAdapter(Shader, {
							    apply(){
							        this.setUniformf("u_time", Time.time / Scl.scl(1.0));
							    }
						    }, shader[5][0], shader[5][1])
						};

						Draw.shader(current);
						Draw.rect(Core.atlas.find(shader[0]), shader[3], shader[4]);
						Draw.shader(); 
					};
				};
			};

	        Draw.z(Layer.overlayUI);
			Draw.alpha(0.45);
            var u = this._units;

	        if(u.length > 0) {
		        for(var s = 0; s < u.length; s++) {

					Draw.mixcol(u[s][1].color, 1);
					Draw.rect(Vars.content.getByID(ContentType.unit, u[s][0]).icon(Cicon.full), u[s][2][0], u[s][2][1]);
				};
			};

			Draw.reset();
	    },

	    draw(){
	        this.super$draw();

			Draw.reset();

	        Draw.z(Layer.overlayUI);
			Draw.alpha(0.2);
            var u = this._units;

	        if(u.length > 0) {
		        for(var s = 0; s < u.length; s++) {

					Draw.mixcol(u[s][1].color, 1);
					Draw.rect(Vars.content.getByID(ContentType.unit, u[s][0]).icon(Cicon.full), u[s][2][0], u[s][2][1]);
				};
			};
	
	        Draw.z();
			Draw.reset();

		    Draw.color(this.getTeam().color);
		    Draw.rect(Core.atlas.find("collos-unit-block-team"), this.x, this.y);
		    Draw.color();

            var x = this.getSpawnPos()[0];
            var y = this.getSpawnPos()[1];
            
            if(y != this.y && x != this.x){
			    Draw.color(Color.red.shiftHue(Time.time*0.1));
			    Draw.rect(Core.atlas.find("collos-unit-block-team"), x, y, 20, 20);
			    Draw.color();
		    }
		}, 
	
		addUnit(arr){
	        for(var i = arr[2]; i > 0; i--) {
				this._units.push([arr[0], arr[1], arr[3]]); 
	        }
		}, 
	
		createUnitsOnSpawners(){
            var spawners = Vars.spawner.getSpawns();
            var spread = 16;
	        if(this._units.length > 0 && spawners.size > 0) {
		        for(var s = 0; s < spawners.size; s++) {
                    var spawn = spawners.get(s);
			        for(var u = 0; u < this._units.length; u++) {
				        Time.run(3.0 * u, run(() => {
			                var unit = Vars.content.getByID(ContentType.unit, this._units[u][0]).spawn(this._units[u][1], spawn.drawx()+Mathf.range(spread), spawn.drawy()+Mathf.range(spread));
						}))
					}
				}
			};
	
			this._units = [];
		}, 
	
		createUnitsOnRandomSpawner(){
            var spawn = Vars.spawner.getSpawns().random();
            var spread = 16;
	        if(this._units.length > 0 ) {
		        for(var u = 0; u < this._units.length; u++) {
			        Time.run(3.0 * u, run(() => {
		                var unit = Vars.content.getByID(ContentType.unit, this._units[u][0]).spawn(this._units[u][1], spawn.drawx()+Mathf.range(spread), spawn.drawy()+Mathf.range(spread));
					}))
				};
			};
	
			this._units = [];
		}, 
	
		createUnits(){
	        if(this._units.length > 0) {
		        for(var s = 0; s < this._units.length; s++) {
	                var unit = Vars.content.getByID(ContentType.unit, this._units[s][0]).spawn(this._units[s][1], this._units[s][2][0], this._units[s][2][1]);
				
				    var vec = new Vec2();
				    vec.trns(Mathf.random(0.0, 360), 5.0);
				    unit.vel.add(vec.x, vec.y);
				};
			};
	
			this._units = [];
		}, 
	
	    buildUnitButtons(name, table) {
		    table.button(new TextureRegionDrawable(Vars.content.getByName(ContentType.unit, name).icon(Cicon.small)),
	        Styles.clearFulli, 32.0, run(() => {
		    	this.addUnit([Vars.content.getByName(ContentType.unit, name), this.getTeam(), this._mul]);
		    }))
	    }, 
	   
	    buildConfiguration(table) {
			 var dialog = new BaseDialog("@dialog.unit-block-title.name");
			 var cont = dialog.cont;

			cont.table(
                cons(i => {
					i.table(
                        cons(t => {
							 t.button("@button.unit-block-team.name", 
                             Icon.modeSurvival, () => {
								 this.teamDialog();
							 }).width(160).pad(4).growY();
	
							 t.button("@button.unit-block-position.name", 
                             Icon.grid, () => {
						         this.posDialog();
							 }).width(160).pad(4).growY();
	
							 t.button("@button.unit-block-multipliers.name", 
                             Icon.modeAttack, () => {
						         this.multipliersDialog();
							 }).width(160).pad(4).growY().row();
	
							 t.button("@button.unit-block-shaders.name", 
                             Icon.pencil, () => {
						         this.shadersDialog();
							 }).width(160).pad(4).growY();

							 t.button("@button.unit-block-waves.name", 
                             Icon.waves, () => {
								 this.wavesDialog();
							 }).width(160).pad(4).growY();
	
							 t.button("@button.unit-block-lastLog.name", 
                             Icon.terminal, () => {
						         this.lastLogDialog();
							 }).width(160).pad(4).growY().row();
	
							 t.button("@button.unit-block-units.name", 
                             Icon.units, () => {
						         this.unitsDialog();
							 }).width(160).pad(4).growY();
	
							 t.button("@button.unit-block-weather.name", 
                             Icon.move, () => {
						         this.weatherDialog();
							 }).width(160).pad(4).growY();
	
							 t.button("@button.unit-block-scripts.name", 
                             Icon.book, () => {
						         this.scriptsDialog();
							 }).width(160).pad(4).growY().row();
					     })
	                 );
				 })
             ).width(360).bottom().center();
	
	         dialog.addCloseButton();

			 table.button(Icon.commandAttack, () => {
				 this.createUnits();
             });

			 table.button(Icon.play, () => {
				 dialog.show();
             });
		}, 
	
	    scriptsDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-scripts.name");
			var cont = dialog.cont;

            this.text(cont, "@text.write-command");
            
            var defaultScript = this.getScriptText();
            var scriptArea;
            var script;
            var time = 60;
            
			cont.table(
                cons(p => {
	                scriptArea = p.add(new TextArea(defaultScript.toString().replace("\n", "\r"))).size(630, 480).get();
	                scriptArea.setMaxLength(100000);
				})
            ).width(650).height(500).row();

			cont.table(
                cons(t => {
					t.button("@button.start-script", () => {
						try{
				            script = scriptArea.getText();
					        eval(script);  
					        this.setScriptText(script);
					    } catch(e) {
						    Vars.ui.showErrorMessage(e);
					    } 
					}).growX().height(54).pad(4);
				})
            ).width(200).height(50).row();
					
			cont.table(
                cons(t => {
					t.button("@button.set-time", () => {
						Vars.ui.showTextInput("", "@text.set-time", 8, 120, true, 
		                    cons(t => {
								try{
									time = t
								} catch(e) {
									Vars.ui.showErrorMessage("@error.invalid-number");
								}
							})
	                    );
					}).growX().height(54).pad(4).row();
					
					t.button("@button.set-script-as-timer", () => {
						try{
				            script = scriptArea.getText();
					        this.addScriptTimer([time, time, script, false, null]);
					    } catch(e) {
						    Vars.ui.showErrorMessage(e);
					    } 
					}).growX().height(54).pad(4);
				})
            ).width(200).height(120).row();
            
			dialog.addCloseButton();
			dialog.show();
	    },
	
	    multipliersDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-multiplers.name");
			var cont = dialog.cont;

            this.text(cont, "@text.choose-button-multiplier");

			cont.table(
	            cons(t => {
					t.button("1", () => {
						this.setMultiplier(1);
					}).growX().height(54).pad(4);

					t.button("3", () => {
						this.setMultiplier(3);
					}).growX().height(54).pad(4);

					t.button("5", () => {
						this.setMultiplier(5);
					}).growX().height(54).pad(4).row();

					t.button("10", () => {
						this.setMultiplier(10);
					}).growX().height(54).pad(4);

					t.button("25", () => {
						this.setMultiplier(26);
					}).growX().height(54).pad(4);

					t.button("50", () => {
						this.setMultiplier(50);
					}).growX().height(54).pad(4).row();

					t.button("100", () => {
						this.setMultiplier(100);
					}).growX().height(54).pad(4);

					t.button("250", () => {
						this.setMultiplier(250);
					}).growX().height(54).pad(4);

					t.button("500", () => {
						this.setMultiplier(500);
					}).growX().height(54).pad(4);
				})
            ).width(300).row(); 

            this.text(cont, "@text.set-multiplier-button");

			cont.table(
	            cons(t => {
					t.button("@button.set-multiplier", () => {
						Vars.ui.showTextInput("", "@text.set-multipler", 8, 15, true, 
		                    cons(t => {
								try{
									this.setMultiplier(Mathf.round(t));
								} catch(e){
									Vars.ui.showErrorMessage("@error");
								}
							})
	                    );
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row(); 

			dialog.addCloseButton();
			dialog.show();
	    },
	
	    shadersDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-shaders.name");
			var cont = dialog.cont;

            var enable = true;
            var vertex = "";
            var fragment = "";

            var texture = "spectre";
            var preString = "";

            var x = this.x;
            var y = this.y; 

            for(var i = 0; i < defaultShaderVertex.length; i++) {
                 var string = defaultShaderVertex.charAt(i);
                 if(string == ";") { 
                     vertex += ";\n"
                 } else if(string == "{" && preString == ")") { 
                     vertex += "{\n"
                 } else {
                     vertex += string
                 };

                 preString = string;
            };

            for(var i = 0; i < defaultShaderFragment.length; i++) {
                 var string = defaultShaderFragment.charAt(i);
                 if(string == ";") { 
                     fragment += ";\n"
                 } else if(string == "{" && preString == ")") { 
                     fragment += "{\n"
                 } else {
                     fragment += string
                 };

                 preString = string;
            };
 
            this.text(cont, "@text.shader-vertex");
 
            var textVertex;
			cont.table(
                cons(p => {
	                textVertex = p.add(new TextArea(vertex.toString().replace("\n", "\r"))).size(630, 480).get();
	                textVertex.setMaxLength(100000);
				})
            ).width(650).height(500).row();
 
            this.text(cont, "@text.shader-fragment");
 
            var textFragment;
			cont.table(
                cons(p => {
	                textFragment = p.add(new TextArea(fragment.toString().replace("\n", "\r"))).size(630, 480).get();
	                textFragment.setMaxLength(100000);
				})
            ).width(650).height(500).row();

            this.text(cont, "@text.shader-texture");

			cont.table(
	            cons(t => {
					t.button("@button.change-shader-texture", () => {
						Vars.ui.showTextInput("", "@text.set-shader-texture", 8, "spectre", true, 
		                    cons(t => {
								if(Core.atlas.has(t)){
									texture = t
								} else{
									Vars.ui.showErrorMessage("@error.texture-not-found");
								}
							})
	                    );
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row(); 
	    
			cont.table(
	            cons(t => {
					t.button("@button.save-shader", () => {
                        dialog.hide();
                        Vars.ui.showCustomConfirm("@dialog.unit-block-save-shader.name", "@text.save-shader-question", "@text.yes", "@text.no", 
                            () => {
                                var vert = "";
                                var frag = "";
					            for(var i = 0; i < textVertex.getText().length; i++) {
					                 var string = textVertex.getText()[i];
					                 if(string == "\n") { 
					                     //vert += ""
					                 } else {
					                     vert += string
					                 };
					            };

					            for(var i = 0; i < textFragment.getText().length; i++) {
					                 var string = textFragment.getText()[i];
					                 if(string == "\n") { 
					                     //frag += ""
					                 } else {
					                     frag += string
					                 };
					            };

								//this.addShader([texture, 0, enable, x, y, [vert, frag]]);

                                dialog.show();
							}, 
                            () => {
                                dialog.show();
							}
	                    )
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row(); 

			dialog.addCloseButton();
			dialog.show();
	    },

	    parseLog(text){
		    var arr = text.split("\n");

		    for(var i = 0; i < arr.length; i++){
		        arr[i] = arr[i].replace(/Colloseus Mod/g,"[#D800FF]Colloseus Mod");
		        arr[i] += "[]";
	
		       var t = arr[i];
		       if(t.substring(0, 3) == "[W]"){
		           t = "[yellow]\[W\][]" + t.substring(3, t.length);
		           arr[i] = t;

		        } else if(t.substring(0, 3) == "[I]"){
			        t = "[royal]\[I\][]" + t.substring(3, t.length);
			        arr[i] = t;

		        } else if(t.substring(0, 3) == "[E]"){
			        t = "[scarlet]\[E\][]" + t.substring(3, t.length);
			        arr[i] = t;
		        }
		    };
	
		    return arr.join("\n");
	    },
	
	    weatherDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-weather.name");
			var cont = dialog.cont;
            var intensity = 1;
            var minutes = 1;

            var weathers = Vars.content.getBy(ContentType.weather);
            
			cont.table(
	            cons(t => {
					t.button("@button.reset-weather", () => {
				        const ws = Vars.content.getBy(ContentType.weather).toArray();
				        for(var i = 0; i < ws.length; i++){
					        while(ws[i].isActive()){
					            ws[i].remove();
					        }
				        }
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row();  
           
            this.text(cont, "@text.weather-intensity");

			cont.table(
	            cons(t => {
					t.button("@button.set-weather-intensity", () => {
						Vars.ui.showTextInput("", "@text.set-number", 8, 1, true, 
		                    cons(t => {
								try{
									intensity = t
								} catch(error) {
									Vars.ui.showErrorMessage("@error.invalid-number");
								}
							})
	                    );
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row(); 

            this.text(cont, "@text.weather-duration");

			cont.table(
	            cons(t => {
					t.button("@button.set-duration-minutes", () => {
						Vars.ui.showTextInput("", "@text.set-number", 8, 5, true, 
		                    cons(t => {
								try{
									minutes = t
								} catch(error) {
									Vars.ui.showErrorMessage("@error.invalid-number");
								}
							})
	                    );
					}).growX().height(54).pad(4).row();

					t.button("@button.set-duration-hours", () => {
						Vars.ui.showTextInput("", "@text.set-number", 8, 1.5, true, 
		                    cons(t => {
								try{
									minutes = t * 60.0
								} catch(error) {
									Vars.ui.showErrorMessage("@error.invalid-number");
								}
							})
	                    );
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row(); 
	    
            this.text(cont, "@text.set-weather");
            
			cont.table(
	            cons(t => {
                    var num = 0;
					weathers.each(
	                    cons(w => {
							t.button(
				                cons(b => {
									b.left();
									b.add(Core.bundle.get("weather."+w.name+".name"));
								}), 
				                () => {
									w.create(intensity, minutes * Time.toMinutes)
								}
			                ).margin(12).fillX();
			
							if(++num % 2 == 0) t.row();
						})
	                )
				})
            ).width(300).row(); 

			dialog.addCloseButton();
			dialog.show();
	    },
	
	    lastLogDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-lastLog.name");
			var cont = dialog.cont;
	    
		    cont.pane(
                cons(table => {
			        table.top().left();
			        table.add(this.parseLog(Core.settings.getDataDirectory().child('last_log.txt').readString()));
			    })
            ).grow();

			dialog.addCloseButton();
			dialog.show();
	    },

		unitsDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-units.name");
			var cont = dialog.cont;

			this.text(cont, "@text.choose-units");
	
			cont.pane(cons(p => {
				var num = 0;
				var units = Vars.content.units();
	
				units.each(
                    cons(u => {
						p.button(
			                cons(b => {
								b.left();
								b.image(u.icon(Cicon.medium)).size(40).padRight(2);
								b.add(u.localizedName);
							}), 
			                () => {
								this.addUnit([u.id, this.getTeam(), this.getMultiplier(), this.getSpawnPos()]);
							}
		                ).margin(12).fillX();
		
						if(++num % 3 == 0) p.row();
					})
                );
			})).width(800).height(540).top().center().row();

			this.text(cont, "@text.actions-with-all-units");

			cont.table(
	            cons(t => {
					t.button("@button.kill-all-units", () => {
						Groups.unit.each(cons(unit => unit.kill()))
					}).growX().height(54).pad(4).row();

					t.button("@button.heal-all-units", () => {
						Groups.unit.each(cons(unit => unit.kill()))
					}).growX().height(54).pad(4).row();

					t.button("@button.tp-all-units", () => {
						Groups.unit.each(cons(unit => unit.set(this.x, this.y)))
					}).growX().height(54).pad(4).row();

					t.button("@button.damage-all-units", () => {
						Groups.unit.each(cons(unit => unit.damage(unit.health-1)))
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row(); 

			this.text(cont, "@text.all-units");

			cont.table(
                cons(t => {
					t.button("@button.show-all-units", () => {
						this.allUnitsDialog();
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row();

			this.text(cont, "@text.spawn");

			cont.table(
                cons(t => {
					t.button("@button.spawn-units", () => {
						this.createUnits();
					}).growX().height(54).pad(4).row();

                    if(Vars.spawner.getSpawns().size > 0){
						t.button("@button.spawn-units-on-spawners", () => {
							this.createUnitsOnSpawners();
						}).growX().height(54).pad(4).row();
	
						t.button("@button.spawn-units-on-random-spawner", () => {
							this.createUnitsOnRandomSpawner();
						}).growX().height(54).pad(4).row();
				    } 
				})
            ).width(300).row();

			dialog.addCloseButton();
			dialog.show();
		}, 

		allUnitsDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-all-units.name");
			var cont = dialog.cont;

			cont.pane(
                cons(p => {
		            var units = this._units;
                    var num = 0;

			        if(units.length > 0) {
				        for(var s = 0; s < units.length; s++) {
							this.buildUnitButton(p, s, units);
			
							if(++num % 1 == 0) p.row();
		                }
	                }
				})
            ).width(800).height(540).top().center().row();

			dialog.addCloseButton();
			dialog.show();
		}, 

		buildUnitButton(p, s, units){
            var unit = units[s];
            var uuu = Vars.content.getByID(ContentType.unit, unit[0]);
            var button = null;

			p.button(
                cons(b => {
                    button = b;
					b.left();
				    b.image(uuu.icon(Cicon.medium)).size(40).padRight(2);
					b.row();
					b.add(uuu.localizedName);
					b.row();
					b.add(Core.bundle.get("text.unit-id")+unit[0]);
					b.row();
					b.add(Core.bundle.get("text.unit-team")+unit[1]);
					b.row();
					b.add(Core.bundle.get("text.unit-pos")+unit[2]);
					b.row();
				}), 
                () => {
                    if(this._units.indexOf(unit) != -1) this.unitInfoDialog(uuu, unit, units, button);
				}
            ).margin(12).fillX();
		},

		unitInfoDialog(uuu, unit, units, button){
			var dialog = new BaseDialog("@dialog.unit-block-unit-info.name");
			var cont = dialog.cont;

			cont.table(
	            cons(t => {
					t.button("@button.remove-unit", () => {
						this._units = units.filter((n) => { return n != unit });
                        button.add("[#D2474B]"+Core.bundle.get("text.unit-is-deleted")+"[]");
                        button.row();
                        dialog.hide();
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row();

			this.text(cont, "@text.change-unit-command");

			cont.pane(
	            cons(p => {
					var num = 0;
					var teams = Team.all;
	
					for(var i = 0; i < teams.length; i++){
                        this.changeUnitTeam(p, i, teams, unit);
						if(++num % 4 == 0) p.row();
					};
				})
            ).width(300.0).height(300.0).center().row();

			this.text(cont, "@text.unit-stats");

		    cont.pane(
                cons(table => {
			        table.top().left();
			        table.add(this.parseUnit(uuu), 1.0/2.0);
			    })
            ).width(300.0).height(420.0).top().center().row();

			dialog.addCloseButton();
			dialog.show();
		},

	    changeUnitTeam(p, i, teams, unit){
			var team = teams[i];

			this.addTeamButton(p, i, this.changeTeam(team, unit)); 
		},

	    changeTeam(team, unit){
            unit[1] = team;
		},

	    parseUnit(unit){
	        const arr2 = [];
	        const arr = Object.keys(unit);
	      
	        for(var i = 0; i < arr.length; i++){
	            if(arr[i] === ""){
		            continue;
		        };

	            try{
		            if((typeof(unit[arr[i]])) === "function"){
			            continue;
		            };

                    var arg2 = (unit[arr[i]] == null) ? (": [lightgray]null[]") : (typeof(unit[arr[i]]) === "object" ? ": [coral]" + unit[arr[i]] + "[]" : ": [accent]" + unit[arr[i]] + "[]");
                    var arg = arr[i]+(arg2);
		            arr2.push(arg);
		        }
		        catch(ignore){}
		    };

	        return arr2.join("\n");
	    },

		wavesDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-waves.name");
			var cont = dialog.cont;

			this.text(cont, "@text.summon-waves-with-buttons");

			cont.table(
	            cons(t => {
					t.button("@button.summon-wave", () => {
						Vars.logic.runWave()
					}).growX().height(54).pad(4).row();

					t.button("@button.summon-wave-with-mulitplier", () => {
						for(var i = 0; i < this._mul; i++) Vars.logic.runWave()
					}).growX().height(54).pad(4).row();

					t.button("@button.summon-waves", () => {
						Vars.ui.showTextInput("", "@text.set-number", 8, 3, true, 
		                    cons(t => {
								try{
									for(var i = 0; i < t; i++) Vars.logic.runWave()
								} catch(error) {
									Vars.ui.showErrorMessage("@error");
								}
							})
	                    );
					}).growX().height(54).pad(4).row();
				})
            ).width(300).row(); 

			this.text(cont, "@text.timer-wave"); 
     
            cont.row();

			cont.table(
	            cons(t => {
					t.button("@button.show-timers", () => {
						this.timersDialog();
					}).growX().height(54).pad(4).row();

					t.button("@button.add-new-timer", () => {
						this.newWaveTimerDialog();
					}).growX().height(54).pad(4).row();
				})
            ).width(300);

			dialog.addCloseButton();
			dialog.show();
		},

		newWaveTimerDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-create-wave-timer.name");
			var cont = dialog.cont;
            var array = [60, 60, 1];

			cont.table(
	            cons(
                    t => {
						t.button("@button.set-timer-work", 
	                        () => {
		                        Vars.ui.showTextInput("", "@text.set-number", 8, 60, true, 
				                    cons(
		                                t => {
											try{
												array[0] = t;
											} catch(error) {
												Vars.ui.showErrorMessage("@error");
											}
										}
	                                )
							    )
							}
                        ).growX().height(54).pad(4).row();
	
						t.button("@button.set-timer-waves",
	                        () => {
		                        Vars.ui.showTextInput("", "@text.set-number", 8, 1, true, 
				                    cons(
	                                    t => {
											try{
												array[2] = t;
											} catch(error) {
												Vars.ui.showErrorMessage("@error");
											}
										}
                                    )
							    )
							}
	                    ).growX().height(54).pad(4).row();
	
						t.button("@button.save-timer", 
		                    () => {
								this.addWaveTimer([array[0], array[0], array[2]]);
							}
	                    ).growX().height(54).pad(4).row();
					}
                )
            ).width(300);

			dialog.addCloseButton();
			dialog.show();
		},

		timersDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-timers.name");
			var cont = dialog.cont;

			this.text(cont, "@text.choose-timer");
	
			cont.pane(
                cons(p => {
					var num = 0;
	
		            var waves = this.getWaveTimers();
		            for(var i = 0; i < waves.length; i++) {
		                var timer = waves[i]; 
	
						p.button(
			                cons(b => {
								b.left();
								b.add(Core.bundle.get("text.timer-work")+timer[0]);
								b.row();
								b.add(Core.bundle.get("text.timer-waves")+timer[2]);
							}), 
			                () => {
								this.setWaveTimers(waves.filter((n) => { return n != timer }));
							}
		                ).margin(12).fillX();
		
						if(++num % 2 == 0) p.row();
	                };
				})
            ).width(800).height(540).top().center().row();

			cont.table(
	            cons(
                    t => {
						t.button("@button.delete-all-timers", 
		                    () => {
                                dialog.hide();
                                Vars.ui.showCustomConfirm("@dialog.unit-block-delete-all-timers.name", "@text.delete-all-timers-question", "@text.yes", "@text.no", 
	                                () => {
	                                    dialog.show();
										this.setWaveTimers([]);
									}, 
	                                () => {
	                                    dialog.show();
									}
			                    )
							}
	                    ).growX().height(54).pad(4).row();
					}
                )
            ).width(300);

			dialog.addCloseButton();
			dialog.show();
		},

		teamDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-team.name");
			var cont = dialog.cont;

			this.text(cont, "@text.base-teams"); 

			cont.pane(
	            cons(p => {
					var num = 0;
					var teams = Team.baseTeams;
	
					for(var i = 0; i < teams.length; i++){
						this.addTeamButton(p, i, null);
						if(++num % 3 == 0) p.row();
					};
				})
            ).width(320).center().row();

			this.text(cont, "@text.all-teams");

			cont.pane(
	            cons(p => {
					var num = 0;
					var teams = Team.all;
	
					for(var i = 0; i < teams.length; i++){
						this.addTeamButton(p, i, null);
						if(++num % 4 == 0) p.row();
					};
				})
            ).width(320).height(220).center().row();

			this.text(cont, "@text.short.others");

			cont.table(
	            cons(t => {
					t.button("@button.reset-team", () => {
						this.setTeam(this.team.id);
					}).growX().height(54).pad(4).row();

					t.button("@button.random-base-team", () => {
						this.setTeam(Team.baseTeams[Mathf.round(Mathf.random(0.0, Team.baseTeams.length))].id);
					}).growX().height(54).pad(4).row();

					t.button("@button.random-all-team", () => {
						this.setTeam(Team.all[Mathf.round(Mathf.random(0.0, Team.all.length))].id);
					}).growX().height(54).pad(4).row();
	
					t.button("@button.set-team-by-id", () => {
						Vars.ui.showTextInput("", "@text.set-id", 8, this.getTeam().id, true, 
		                    cons(t => {
								if(t > 255) t = 255;
								if(Team.get(t) != null){
									this.setTeam(t);
								} else {
									Vars.ui.showErrorMessage("@error.invalid-id");
								}
							})
	                    );
					}).growX().height(54).pad(4);
				})
            ).width(300);

			dialog.addCloseButton();
			dialog.show();
		},
	   
	    text(cont, text) {
			cont.table(
                cons(t => {
					t.top().margin(6);
					t.add(text).growX().color(Pal.accent);
					t.row();
					t.image().fillX().height(3).pad(4).color(Pal.accent);
				})
            ).width(420).center().row();
		},

		addTeamButton(p, i, func){
            var team = Team.all[i];
			p.button(
                cons(b => {
					b.left();
					b.image().size(40).pad(2).color(team.color);
				}), 
	            () => {
					if(func == null) this.setTeam(team.id);
					if(func != null) func;
				}
            ).pad(2);
		},

		posDialog(){
			var dialog = new BaseDialog("@dialog.unit-block-position.name");
			var cont = dialog.cont;

			var worldX = Mathf.round(Vars.world.width() * Vars.tilesize);
			var worldY = Mathf.round(Vars.world.height() * Vars.tilesize);

			cont.table(
	             cons(t => {
					t.button("@button.reset-position", () => {
						this.setSpawnPos([Mathf.round(this.x), Mathf.round(this.y)]);
					}).growX().height(54).pad(4);
				})
            ).width(300).center().row();

			this.text(cont, "@text.change-position");

			cont.table(cons(t => {
				t.button("@button.set-x", () => {
					Vars.ui.showTextInput("", "X:", 4, (this.getSpawnPos()[0] / Vars.tilesize), true, cons(x => {
						this.setSpawnPos([Mathf.clamp(Number(x) * Vars.tilesize, 0, worldX), this.getSpawnPos()[1]]);
					}));
				}).growX().height(54).pad(4).row();

				t.button("@button.set-y", () => {
					Vars.ui.showTextInput("", "Y:", 4, (this.getSpawnPos()[1] / Vars.tilesize), true, cons(y => {
						this.setSpawnPos([this.getSpawnPos()[0], Mathf.clamp(Number(y) * Vars.tilesize, 0, worldY)]);
					}));
				}).growX().height(54).pad(4);
			})).width(300).center().row();

			this.text(cont, "@text.change-position-buttons");

			cont.table(cons(t => {
                t.add("x: ", 2.0).growX();
				t.button("-10", () => {
					this.setSpawnPos([Mathf.clamp(this.getSpawnPos()[0]-80, 0, worldX), this.getSpawnPos()[1]]);
				}).growX().height(80).width(80).pad(4);

				t.button("-1", () => {
					this.setSpawnPos([Mathf.clamp(this.getSpawnPos()[0]-8, 0, worldX), this.getSpawnPos()[1]]);
				}).growX().height(80).width(80).pad(4);

				t.button("+1", () => {
					this.setSpawnPos([Mathf.clamp(this.getSpawnPos()[0]+8, 0, worldX), this.getSpawnPos()[1]]);
				}).growX().height(80).width(80).pad(4);

				t.button("+10", () => {
					this.setSpawnPos([Mathf.clamp(this.getSpawnPos()[0]+80, 0, worldX), this.getSpawnPos()[1]]);
				}).growX().height(80).width(80).pad(4);
   
                t.row();

                t.add("y: ", 2.0);
				t.button("-10", () => {
					this.setSpawnPos([this.getSpawnPos()[0], Mathf.clamp(this.getSpawnPos()[1]-80, 0, worldY)]);
				}).growX().height(80).width(80).pad(4);

				t.button("-1", () => {
					this.setSpawnPos([this.getSpawnPos()[0], Mathf.clamp(this.getSpawnPos()[1]-8, 0, worldY)]);
				}).growX().height(80).width(80).pad(4);

				t.button("+1", () => {
					this.setSpawnPos([this.getSpawnPos()[1], Mathf.clamp(this.getSpawnPos()[1]+8, 0, worldY)]);
				}).growX().height(80).width(80).pad(4);

				t.button("+10", () => {
					this.setSpawnPos([this.getSpawnPos()[1], Mathf.clamp(this.getSpawnPos()[1]+80, 0, worldY)]);
				}).growX().height(80).width(80).pad(4);
   
                t.row();
			})).width(450).height(300).center();

			dialog.addCloseButton();
			dialog.show();
		},

		writeBase(write){
			this.super$writeBase(write);

			write.str(this._script);
			write.i(this._multiplier);
			write.i(this._team);

			write.f(this.getSpawnPos()[0]);
			write.f(this.getSpawnPos()[1]);
		},

		readBase(read){
			this.super$readBase(read);

			this._script = read.str();
			this._multiplier = read.i();
			this._team = read.i();

			var x = read.f();
			var y = read.f();
			this.setSpawnPos([x, y]);
		},

		setMultiplier(a){
			this._multiplier = a;
		},

		getMultiplier(){
			return this._multiplier;
		}, 

		setSpawnPos(pos){
			this._pos = pos;
		},

		getSpawnPos(){
			return this._pos;
		}, 

		setScriptTimers(arr){
			this._scriptTimers = arr;
		},

		getScriptTimers(){
			return this._scriptTimers;
		}, 

		addScriptTimer(a){
		    this._scriptTimers.push(a);
		}, 

		setWaveTimers(arr){
			this._timers = arr;
		},

		getWaveTimers(){
			return this._timers;
		}, 

		addWaveTimer(a){
		    this._timers.push(a);
		}, 

		setScriptText(str){
			this._script = str;
		},

		getScriptText(){
			return this._script;
		}, 

		setShaders(arr){
			this._shaders = arr;
		},

		getShaders(){
			return this._shaders;
		}, 

		addShader(a){
		    this._shaders.push(a);
		}, 

		setTeam(id){
			this._team = id;
		},

		getTeam(){
			return Team.get(this._team);
		} 
	});
	return ent;
};

UnitCommandBlock.flags = EnumSet.of(BlockFlag.unitModifier);
UnitCommandBlock.configurable = true;
UnitCommandBlock.size = 2;
UnitCommandBlock.unitCapModifier = 1000;
UnitCommandBlock.update = true;
UnitCommandBlock.sync = true;
UnitCommandBlock.expanded = true;
UnitCommandBlock.breakable = true;
UnitCommandBlock.destructible = true;
UnitCommandBlock.category = Category.effect;
UnitCommandBlock.buildVisibility = BuildVisibility.sandboxOnly;
UnitCommandBlock.requirements = ItemStack.with();