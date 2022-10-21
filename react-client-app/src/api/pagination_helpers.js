import queryString from "query-string"

const set_pagination_variables = async (search, page_size, set_page_size, currentPage, setCurrentPage) => {
    const parsed_query = queryString.parse(search)

    let local_page_size = page_size
    if ("page_size" in parsed_query) {
        set_page_size(parsed_query["page_size"])
        local_page_size = parsed_query["page_size"]
    }
    let local_page = currentPage
    if ("p" in parsed_query) {
        setCurrentPage(parsed_query["p"])
        local_page = parsed_query["p"]
    }
//    if ("page_size" in parsed_query || "p" in parsed_query) {
//        window.history.pushState({}, '', `/scanreports/${scan_report_id}/mapping_rules/?p=${local_page}&page_size=${local_page_size}`)
//    }

    return { local_page, local_page_size };
}

export { set_pagination_variables }