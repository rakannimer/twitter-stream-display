library(rmongodb)
host <- 'localhost:27017' 
username <- ''
password <- ''
db <- 'tweet_streams' 
collection <- 'tweets'
namespace <- paste(db, collection, sep='.') 
mongo <- mongo.create(host=host , db=db, username=username, password=password)