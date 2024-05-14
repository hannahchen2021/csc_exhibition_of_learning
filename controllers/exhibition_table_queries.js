// functions associated with getting data from the exhibition table
const { query } = require("express");
const db = require("../db/db")

const getAllExhibitions = async(req, res) => {
    try {
        const exhibitions = await db.select("*").from("exhibitions");
        res.send(exhibitions);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message}) 
    }
}

// get the exhibitions that can be displayed on the home page
const getExhibitionsHomePage = async(req, res) => {
    try {
        const exhibitions = await db.select("*").from("exhibitions")
            .where("display_on_home_page", true);
        res.send(exhibitions);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: error.message})
    }
}

// get a json string of the exhibitions that can be displayed on the home page
const getExhibitionsHomePageJSON = async() => {
    try {
        //console.log("starting")
        columns = ['exhibitions.exhibition_id', 'exhibitions.description', 'exhibitions.video_html_code', 'users.first_name', 'users.last_name', 'classes.academic_year', 'classes.term', 'courses.course_number', 'courses.course_name']
        const exhibitions = await db
            .select(columns.concat([
                db.raw('ARRAY_AGG(skills.skill_name) skills'),
                db.raw('ARRAY_AGG(skills.throughline) throughlines')
               ]))
            .from("exhibitions")
            
            .where("display_on_home_page", true)
            .innerJoin("users", "exhibitions.user_id_ref", "=", "users.user_id")
            .innerJoin("classes", "exhibitions.class_id_ref", "=", "classes.class_id")
            .innerJoin("courses", "classes.course_id_ref", "=", "courses.course_id")
            .leftJoin("exhibitionSkillPairs", "exhibitions.exhibition_id", "exhibitionSkillPairs.exhibition_id_ref")
            
            .leftJoin("skills", "exhibitionSkillPairs.skill_id_ref", "skills.skill_id")
            
            .groupBy(columns)
            ;
            //console.log("returning");
            //console.log(JSON.stringify(exhibitions));
        return exhibitions;
    } catch (error) {
        console.log(error)
        return [];
    }
}

// SEARCH RESUlTS FOR PAGE
const getExhibitionsSearchResults = async(search_parameters) => {
    var user_id = search_parameters.user_id;
    var course_id = search_parameters.course_id;
    var admin_id = search_parameters.admin_id; 
    var skill_id = search_parameters.skill_id; 
    var academic_year = search_parameters.academic_year;
    var term = search_parameters.term;
    var course_level = search_parameters.course_level;
    console.log("user id:", user_id)

    try {
        columns = ['exhibitions.exhibition_id', 'exhibitions.description', 'exhibitions.video_html_code', 'users.first_name', 'users.last_name', 'classes.academic_year', 'classes.term', 'courses.course_number', 'courses.course_name']

        const exhibitions = 
        await db
        //.select("*")
        .select(columns
            .concat([
            db.raw('ARRAY_AGG(skills.skill_name) skills'),
            db.raw('ARRAY_AGG(skills.throughline) throughlines')
           ])
           )


        .from("exhibitions")
        .innerJoin("users", "exhibitions.user_id_ref", "=", "users.user_id")
        .innerJoin("classes", "exhibitions.class_id_ref", "=", "classes.class_id")
        .innerJoin("courses", "classes.course_id_ref", "=", "courses.course_id")
        .innerJoin("admins", "classes.admin_id_ref", "=", "admins.admin_id")
            .modify(function(queryBuilder) {
                queryBuilder.leftJoin("exhibitionSkillPairs", "exhibitions.exhibition_id", "exhibitionSkillPairs.exhibition_id_ref")
                .leftJoin("skills", "exhibitionSkillPairs.skill_id_ref", "skills.skill_id")
                if(skill_id.length != 0){
                    queryBuilder
                    .whereIn("exhibitionSkillPairs.skill_id_ref", skill_id)
                    
                }
                queryBuilder.distinctOn('exhibition_id')

                if(user_id.length != 0){
                    queryBuilder
                    .whereIn("users.user_id", user_id)
                }

                if(course_id.length != 0){
                    queryBuilder
                    .whereIn("courses.course_id", course_id)
                }

                if(admin_id.length != 0){
                    queryBuilder
                    .whereIn("admins.admin_id", admin_id)
                }

                if(academic_year.length != 0){
                    queryBuilder.whereIn("classes.academic_year", academic_year)
                }

                if(term.length != 0){
                    queryBuilder.whereIn("classes.term", term)
                }

                if(course_level.length != 0){
                    console.log("we're in!")
                    console.log(course_level)
                    queryBuilder.whereIn("courses.course_level", course_level)
                }
           })
           .groupBy(columns)

        return exhibitions;
    } catch (error) {
        console.log(error)
        return [];
    }

}

module.exports = {
    getAllExhibitions,
    getExhibitionsHomePage,
    getExhibitionsHomePageJSON,
    getExhibitionsSearchResults,
};