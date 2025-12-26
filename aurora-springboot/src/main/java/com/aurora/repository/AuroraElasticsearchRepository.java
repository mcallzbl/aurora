package com.aurora.repository;

import com.aurora.model.dto.ArticleSearchDTO;
import org.springframework.stereotype.Repository;


/**
 * @author 花未眠
 * elasticsearch
 */
@Repository
public interface AuroraElasticsearchRepository extends org.springframework.data.elasticsearch.repository.ElasticsearchRepository<ArticleSearchDTO, Integer> {

}
