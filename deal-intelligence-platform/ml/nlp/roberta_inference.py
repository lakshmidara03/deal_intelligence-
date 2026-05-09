from sentiment_pipeline import SentimentService

service = SentimentService("cardiffnlp/twitter-roberta-base-sentiment-latest")


def infer(text: str) -> dict:
    return service.analyze(text)
