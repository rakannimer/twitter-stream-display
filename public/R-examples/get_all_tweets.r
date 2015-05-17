library(plyr)
library(rmongodb)
host <- 'localhost:27017' 
username <- ''
password <- ''
db <- 'tweet_streams' 
collection <- 'tweets'
namespace <- paste(db, collection, sep='.') 
mongo <- mongo.create(host=host , db=db, username=username, password=password)

## create the empty data frame
tweets_df = data.frame(stringsAsFactors = FALSE)

## create the namespace

## create the cursor we will iterate over, basically a select * in SQL
cursor = mongo.find(mongo, namespace)

## create the counter
i = 1

## iterate over the cursor
while (mongo.cursor.next(cursor)) {
    # iterate and grab the next record
    tmp = mongo.bson.to.list(mongo.cursor.value(cursor))
    # make it a dataframe
    tmp.df = as.data.frame(t(unlist(tmp)), stringsAsFactors = F)
    # bind to the master dataframe
    tweets_df = rbind.fill(tweets_df, tmp.df)
    # to print a message, uncomment the next 2 lines cat('finished game ', i,
    # '\n') i = i +1
}