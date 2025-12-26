package com.aurora.strategy.impl;

import com.aurora.model.dto.ArticleSearchDTO;
import com.aurora.strategy.SearchStrategy;
import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.HighlightQuery;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightFieldParameters;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightParameters;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static com.aurora.constant.CommonConstant.*;
import static com.aurora.enums.ArticleStatusEnum.PUBLIC;

@Log4j2
@Service("esSearchStrategyImpl")
public class EsSearchStrategyImpl implements SearchStrategy {

    @Autowired
    private ElasticsearchOperations elasticsearchOperations;

    @Override
    public List<ArticleSearchDTO> searchArticle(String keywords) {
        if (StringUtils.isBlank(keywords)) {
            return new ArrayList<>();
        }
        return search(buildQuery(keywords));
    }

    private NativeQueryBuilder buildQuery(String keywords) {
        NativeQueryBuilder queryBuilder = new NativeQueryBuilder();
        queryBuilder.withQuery(q -> q
                .bool(b -> b
                        .must(m -> m.bool(sb -> sb
                                .should(s -> s.match(ma -> ma.field("articleTitle").query(keywords)))
                                .should(s -> s.match(ma -> ma.field("articleContent").query(keywords)))
                        ))
                        .must(m -> m.term(t -> t.field("isDelete").value(FALSE)))
                        .must(m -> m.term(t -> t.field("status").value(PUBLIC.getStatus())))
                )
        );
        return queryBuilder;
    }

    private List<ArticleSearchDTO> search(NativeQueryBuilder queryBuilder) {
        HighlightParameters parameters = HighlightParameters.builder()
                .withPreTags(PRE_TAG)
                .withPostTags(POST_TAG)
                .build();

        List<HighlightField> highlightFields = new ArrayList<>();
        highlightFields.add(new HighlightField("articleTitle"));
        highlightFields.add(new HighlightField("articleContent",
                HighlightFieldParameters.builder().withFragmentSize(50).build()));

        queryBuilder.withHighlightQuery(new HighlightQuery(new Highlight(parameters, highlightFields), ArticleSearchDTO.class));
        try {
            // 5. 执行查询
            NativeQuery nativeQuery = queryBuilder.build();
            SearchHits<ArticleSearchDTO> searchHits = elasticsearchOperations.search(nativeQuery, ArticleSearchDTO.class);

            return searchHits.getSearchHits().stream().map(hit -> {
                ArticleSearchDTO article = hit.getContent();
                // 6. 获取高亮结果 (注意返回的是 List<String>)
                var highlightFieldsMap = hit.getHighlightFields();

                if (CollectionUtils.isNotEmpty(highlightFieldsMap.get("articleTitle"))) {
                    article.setArticleTitle(highlightFieldsMap.get("articleTitle").get(0));
                }
                if (CollectionUtils.isNotEmpty(highlightFieldsMap.get("articleContent"))) {
                    List<String> contentHighlights = highlightFieldsMap.get("articleContent");
                    article.setArticleContent(contentHighlights.get(contentHighlights.size() - 1));
                }
                return article;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("ES查询异常: ", e);
        }
        return new ArrayList<>();
    }

}

