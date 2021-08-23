const TeamChanger = extendContent(Block, "team-changer", {});
TeamChanger.buildType = prov(() => extend(Building, {
    addButtonTeam(t, table){
	    table.button(new TextureRegionDrawable(Core.atlas.find("collos-team")).tint(Team.baseTeams[t].color), 
	    Styles.clearFulli, run(() => {
	    	this.team = Team.baseTeams[t];
	        Vars.player.team(Team.baseTeams[t]);
	    }))
    },

    draw(){
        this.super$draw();

	    Draw.color(this.team.color);
	    Draw.rect(Core.atlas.find("collos-team-changer-team"), this.x, this.y);
	    Draw.color();
    },
	        
    buildConfiguration(table) {
        table.defaults().size(50);

        for(var t = 0; t < Team.baseTeams.length; t++){;
            this.addButtonTeam(t, table);
        };
	    
        table.defaults().reset()
	}
}));

TeamChanger.configurable = true;
TeamChanger.size = 2;
TeamChanger.health = 100;
TeamChanger.destructible = true;
TeamChanger.sync = true;
TeamChanger.expanded = true;
TeamChanger.breakable = true;
TeamChanger.solid = false;
TeamChanger.category = Category.effect;
TeamChanger.buildVisibility = BuildVisibility.sandboxOnly;
TeamChanger.requirements = ItemStack.with();
