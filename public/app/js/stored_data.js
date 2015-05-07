var stored_data = {
	r_examples: {
		connect_to_mongo : 
"library(RMongo) \n\
# mg1 <- mongoDbConnect('database_name', host= '127.0.0.1', port=27017) \n\
mg1 <- mongoDbConnect('database_name')",
		show_collections: 
"library(rmongodb) \n \
host <- 'localhost:27017' \n \
username <- '' \n \
password <- '' \n \
db <- 'tweet_streams' \n \
mongo <- mongo.create(host=host , db=db, username=username, password=password) \n \
cat (mongo.get.database.collections(mongo, db))",
		count_entries: 
"library(rmongodb) \n\
host <- 'localhost:27017' \n \
username <- '' \n \
password <- '' \n \
db <- 'tweet_streams' \n \
collection <- 'tweets'\
namespace <- paste(db, collection, sep='.') 'tweet_streams.tweets' \n \
mongo <- mongo.create(host=host , db=db, username=username, password=password) \n \
cat(mongo.count(mongo, namespace, mongo.bson.empty()))\
\
# get all tweets with offset 0 limit 5 \n \
query <- dbGetQuery(mg1, 'tweets','{}',0,5); \n\
data1 <- query[c('language','search_terms')] \n\
print(data1)",
		volcano:
"persp(volcano, expand = 0.5)"
	}
	
};

module.exports = stored_data;